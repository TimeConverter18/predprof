from django.db import models


class TaskDifficulty(models.TextChoices):
    EASY = 'easy', 'Лёгкий'
    MEDIUM = 'middle', 'Средний'
    HARD = 'high', 'Сложный'


class SubjectTheme(models.Model):
    name = models.CharField(max_length=100, unique=True)
    subject = models.ForeignKey(
        'Subject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='themes',
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=50)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    theme = models.ForeignKey(
        SubjectTheme,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
    )
    question = models.TextField()
    solution = models.TextField()
    correct_answer = models.TextField()
    difficulty = models.CharField(
        max_length=20,
        choices=TaskDifficulty,
        default=1
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Task №{self.id}'

    class Meta:
        indexes = [
            models.Index(fields=['difficulty', 'subject']),
        ]

