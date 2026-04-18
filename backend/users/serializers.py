from django.db.models import Avg, Count, Q
from rest_framework import serializers
from users.models import User


class UserStatsSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'stats', 'is_superuser']

    def get_stats(self, user):
        train_stats = user.training_statistics.aggregate(
            total=Count('id'),
            correct=Count('id', filter=Q(is_correct=True)),
            avg_speed=Avg('time_to_solve'),
        )

        pvp_stats = user.round_statistics.aggregate(
            total=Count('id'),
            correct=Count('id', filter=Q(is_correct=True)),
            avg_speed=Avg('time_to_solve'),
        )

        # 1. Реальное количество задач (ЧИСТЫЕ ДАННЫЕ ДЛЯ МАТЕМАТИКИ)
        raw_train_total = train_stats['total'] or 0
        raw_pvp_total = pvp_stats['total'] or 0
        train_correct = train_stats['correct'] or 0
        pvp_correct = pvp_stats['correct'] or 0

        # 2. Количество пройденных "сетов" (ДЛЯ ОТОБРАЖЕНИЯ КОЛИЧЕСТВА)
        train_display_count = raw_train_total // 10
        pvp_display_count = raw_pvp_total // 5

        # Итоговые суммы
        total_tasks = raw_train_total + raw_pvp_total
        total_correct = train_correct + pvp_correct

        return {
            'rate': user.rating,
            'trains_count': round(train_display_count, 1),
            'pvp_count': round(pvp_display_count, 1),

            # ТОЧНОСТЬ: Делим ПРАВИЛЬНЫЕ ЗАДАЧИ на ВСЕ ЗАДАЧИ (не на сеты!)
            'accuracy_train': round(train_correct / raw_train_total * 100, 1) if raw_train_total else 0,
            'accuracy_pvp': round(pvp_correct / raw_pvp_total * 100, 1) if raw_pvp_total else 0,
            'accuracy_total': round(total_correct / total_tasks * 100, 1) if total_tasks else 0,

            'speed_train': round(train_stats['avg_speed'] or 0, 2),
            'speed_pvp': round(pvp_stats['avg_speed'] or 0, 2),
            'speed_total': round(
                ((train_stats['avg_speed'] or 0) * raw_train_total +
                 (pvp_stats['avg_speed'] or 0) * raw_pvp_total) / total_tasks, 2
            ) if total_tasks else 0,
        }

class UsersListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'rating']
