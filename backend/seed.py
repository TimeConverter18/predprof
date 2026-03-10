import random
from django.utils import timezone
from users.models import User, UserTask
from tasks.models import Subject, SubjectTheme, Task, TaskDifficulty

# 1. Очистка старых данных
UserTask.objects.all().delete()
Task.objects.all().delete()
SubjectTheme.objects.all().delete()
Subject.objects.all().delete()
User.objects.filter(is_superuser=False).delete() # Удаляем всех, кроме админов

print("--- Очистка завершена ---")

# 2. Создание структуры задач (ваш код)
data = {
    'Математика': ['Алгебра', 'Геометрия'],
    'Физика': ['Механика', 'Электродинамика'],
}

difficulties = [TaskDifficulty.EASY, TaskDifficulty.MEDIUM, TaskDifficulty.HARD]

for subject_name, themes in data.items():
    subject = Subject.objects.create(name=subject_name)
    for theme_name in themes:
        theme = SubjectTheme.objects.create(name=theme_name, subject=subject)
        for difficulty in difficulties:
            Task.objects.bulk_create([
                Task(
                    subject=subject,
                    theme=theme,
                    question=f'[{subject_name} - {theme_name}] Вопрос №{i}',
                    solution=f'Решение №{i}',
                    correct_answer=str(i * 10),
                    difficulty=difficulty,
                )
                for i in range(1, 11)
            ])

# 3. Создание пользователей для Лидерборда
users_to_create = []
for i in range(1, 21): # Создадим 20 игроков
    users_to_create.append(User(
        username=f'player_{i}',
        email=f'player_{i}@example.com',
        rating=random.randint(1000, 2500), # Случайный рейтинг для теста
        is_active=True
    ))

User.objects.bulk_create(users_to_create)
print(f"Создано пользователей: {User.objects.count()}")

# 4. Имитация решения задач (заполняем ManyToMany через UserTask)
all_users = User.objects.all()
all_tasks = list(Task.objects.all())

user_tasks_to_create = []
for user in all_users:
    # Каждый пользователь "решил" от 5 до 15 случайных задач
    tasks_to_solve = random.sample(all_tasks, random.randint(5, 15))
    for task in tasks_to_solve:
        user_tasks_to_create.append(UserTask(
            user=user,
            task=task,
            is_correct=True
        ))

UserTask.objects.bulk_create(user_tasks_to_create)

print("--- База готова ---")
print(f'Задач: {Task.objects.count()}')
print(f'Рекордов в UserTask: {UserTask.objects.count()}')