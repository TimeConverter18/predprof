import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.utils import timezone

from pvp.exceptions import EnemyNotFound, RoundNotFound, RoundTaskNotFound
from users.models import User
from pvp.models import Round, RoundTask
from core.services.redis_services import statistics_cache, matchmaking_service
from search_enemy.consumers import round_service


class PvpConsumer(AsyncWebsocketConsumer):
    def __init__(self):
        super().__init__()
        self.round_id = None
        self.user = None
        self.enemy = None
        self.round = None

    async def connect(self):
        self.round_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.user = self.scope["user"]

        if not await self.check_user_enemy_round():
            return

        await self.accept()
        await self.add_to_groups()

    async def disconnect(self, code):
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_discard(
                f"user_{self.user.id}", self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "answer":
            await self.handle_answer(data)
        elif message_type == "surrender":
            await self.handle_surrender()
        else:
            await self.send_error("Неизвестный тип сообщения")

    # ------------------------------------------------------------------ #
    #  Ответ на задачу                                                     #
    # ------------------------------------------------------------------ #

    async def handle_answer(self, data):
        task_index = data.get("task_index")
        answer = data.get("answer")

        if task_index is None or answer is None:
            await self.send_error("Отсутствуют task_index или answer")
            return

        try:
            await self.register_answer(task_index, answer)
        except RoundTaskNotFound:
            await self.send_error("Задача не найдена")
            return

        # Отправляем актуальную статистику обоим игрокам после каждого ответа.
        # Порядок uid/eid фиксирован, чтобы избежать гонок в Redis.
        uid, eid = sorted([self.user.id, self.enemy.id])
        await self.handle_stats(uid, eid)

        # Проверяем, завершили ли оба игрока все задания.
        user_done = await statistics_cache.is_finish_solving(
            self.round_id, self.user.id
        )
        enemy_done = await statistics_cache.is_finish_solving(
            self.round_id, self.enemy.id
        )

        if user_done and enemy_done:
            await self.save_total_time(self.user.id)
            await self.save_total_time(self.enemy.id)
            await self.finish_round(surrendered_id=None)

    # ------------------------------------------------------------------ #
    #  Сдача                                                               #
    # ------------------------------------------------------------------ #

    async def handle_surrender(self):
        """Игрок явно сдаётся — раунд завершается немедленно."""
        # Сохраняем время только для тех, кто ещё не закончил.
        if not await statistics_cache.is_finish_solving(self.round_id, self.user.id):
            await self.save_total_time(self.user.id)
        if not await statistics_cache.is_finish_solving(self.round_id, self.enemy.id):
            await self.save_total_time(self.enemy.id)

        await self.finish_round(surrendered_id=self.user.id)

    # ------------------------------------------------------------------ #
    #  Статистика                                                          #
    # ------------------------------------------------------------------ #

    async def handle_stats(self, user_id: int, enemy_id: int):
        stats = await statistics_cache.get_round_stats(
            self.round_id, user_id, enemy_id
        )

        total_tasks = stats["total_tasks"]
        user_correct = stats["user_correct"]
        enemy_correct = stats["enemy_correct"]
        user_answered = stats["user_answered"]
        enemy_answered = stats["enemy_answered"]

        def build_payload(my_correct, my_answered, opp_correct):
            completion_pct = round(my_answered / total_tasks * 100) if total_tasks else 0
            my_correct_pct = round(my_correct / total_tasks * 100) if total_tasks else 0
            opp_correct_pct = round(opp_correct / total_tasks * 100) if total_tasks else 0
            return {
                "type": "ws_stats",
                "completion_percentage": completion_pct,
                "correct_percentage": my_correct_pct,
                "enemy_correct_percentage": opp_correct_pct,
                "current_task": my_answered,
            }

        await self.channel_layer.group_send(
            f"user_{user_id}",
            build_payload(user_correct, user_answered, enemy_correct),
        )
        await self.channel_layer.group_send(
            f"user_{enemy_id}",
            build_payload(enemy_correct, enemy_answered, user_correct),
        )

    async def ws_stats(self, event):
        await self.send(text_data=json.dumps({
            "type": "stats",
            "completion_percentage": event["completion_percentage"],
            "correct_percentage": event["correct_percentage"],
            "enemy_correct_percentage": event["enemy_correct_percentage"],
            "current_task": event["current_task"],
        }))

    # ------------------------------------------------------------------ #
    #  Регистрация ответа                                                  #
    # ------------------------------------------------------------------ #

    async def register_answer(self, task_index: int, answer: str) -> None:
        """
        Задачи можно решать в любом порядке.
        task_index — 0-based индекс задачи (как в тренировке).
        В БД order хранится 1-based, поэтому передаём task_index + 1.
        """
        correct_answer, round_task_id = await self.get_answer_to_task(
            task_index, self.round_id
        )
        is_correct = answer == correct_answer
        await statistics_cache.register_attempt(
            self.round_id,
            self.user.id,
            round_task_id,
            answer,
            is_correct,
        )

    # ------------------------------------------------------------------ #
    #  Завершение раунда                                                   #
    # ------------------------------------------------------------------ #

    async def finish_round(self, *, surrendered_id: int | None):
        """
        surrendered_id — id игрока, который сдался (проигрывает автоматически).
        None — оба закончили, победитель определяется по статистике.
        """
        if surrendered_id is not None:
            winner_id = self.enemy.id if surrendered_id == self.user.id else self.user.id
        else:
            winner_id = await matchmaking_service.determine_winner(
                self.round_id, self.user.id, self.enemy.id, statistics_cache
            )

        user_old_rating, enemy_old_rating = await self.get_ratings(
            self.user.id, self.enemy.id
        )

        await round_service.finish_round(
            self.round_id, self.user.id, self.enemy.id, winner_id
        )

        delta = settings.DELTA
        if winner_id is None:
            user_delta = int(delta * 0.5)
            enemy_delta = int(delta * 0.5)
        elif winner_id == self.user.id:
            user_delta = delta
            enemy_delta = -delta
        else:
            user_delta = -delta
            enemy_delta = delta

        await self.channel_layer.group_send(
            f"user_{self.user.id}",
            {
                "type": "ws_finish_round",
                "my_delta": user_delta,
                "my_old_rating": user_old_rating,
                "my_new_rating": user_old_rating + user_delta,
                "enemy_delta": enemy_delta,
                "enemy_old_rating": enemy_old_rating,
                "enemy_new_rating": enemy_old_rating + enemy_delta,
            },
        )
        await self.channel_layer.group_send(
            f"user_{self.enemy.id}",
            {
                "type": "ws_finish_round",
                "my_delta": enemy_delta,
                "my_old_rating": enemy_old_rating,
                "my_new_rating": enemy_old_rating + enemy_delta,
                "enemy_delta": user_delta,
                "enemy_old_rating": user_old_rating,
                "enemy_new_rating": user_old_rating + user_delta,
            },
        )

        await statistics_cache.delete_all_about_round(
            self.round_id, self.user.id, self.enemy.id
        )

    async def ws_finish_round(self, event):
        await self.send(text_data=json.dumps({
            "type": "finish_round",
            "my_delta": event["my_delta"],
            "my_old_rating": event["my_old_rating"],
            "my_new_rating": event["my_new_rating"],
            "enemy_delta": event["enemy_delta"],
            "enemy_old_rating": event["enemy_old_rating"],
            "enemy_new_rating": event["enemy_new_rating"],
        }))

    # ------------------------------------------------------------------ #
    #  Вспомогательные методы                                              #
    # ------------------------------------------------------------------ #

    async def save_total_time(self, user_id: int) -> None:
        round_obj = await Round.objects.aget(id=self.round_id)
        total_time = (timezone.now() - round_obj.started_at).total_seconds()
        await statistics_cache.set_total_time(
            round_id=self.round_id,
            user_id=user_id,
            total_time=total_time,
        )

    @database_sync_to_async
    def return_enemy(self) -> User:
        enemy = self.round.players.exclude(pk=self.user.id).first()
        if enemy is None:
            raise EnemyNotFound
        return enemy

    @database_sync_to_async
    def is_player_in_round(self):
        return self.round.players.filter(pk=self.user.id).exists()

    @database_sync_to_async
    def get_answer_to_task(self, task_index: int, round_id: int):
        """task_index — 0-based; в БД order хранится 1-based."""
        try:
            round_task = RoundTask.objects.select_related("task").get(
                round=round_id, order=task_index + 1
            )
        except RoundTask.DoesNotExist:
            raise RoundTaskNotFound
        return round_task.task.correct_answer, round_task.id

    @database_sync_to_async
    def get_ratings(self, user_id: int, enemy_id: int):
        users = User.objects.in_bulk([user_id, enemy_id])
        return users[user_id].rating, users[enemy_id].rating

    async def check_user_enemy_round(self) -> bool:
        if not self.user.is_authenticated:
            await self.close(code=4001)
            return False
        try:
            self.round = await Round.objects.aget(pk=self.round_id)
        except Round.DoesNotExist:
            await self.close(code=4004)
            return False
        if not await self.is_player_in_round():
            await self.close(code=4004)
            return False
        try:
            self.enemy = await self.return_enemy()
        except EnemyNotFound:
            await self.close(code=4009)
            return False
        return True

    async def add_to_groups(self):
        await self.channel_layer.group_add(f"user_{self.user.id}", self.channel_name)

    async def send_error(self, message: str):
        await self.send(text_data=json.dumps({"type": "error", "errors": message}))