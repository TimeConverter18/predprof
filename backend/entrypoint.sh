#!/bin/sh

python manage.py migrate

python manage.py shell -c "
from users.models import User
if not User.objects.filter(email='admin@mail.ru').exists():
    User.objects.create_superuser(email='admin@mail.ru', username='admin', password='123456')
    print('Суперпользователь создан')
else:
    print('Суперпользователь уже существует')
"

if [ -f /app/dump.json ] && [ ! -f /app/staticfiles/.data_loaded ]; then
    python manage.py loaddata /app/dump.json || true
    touch /app/staticfiles/.data_loaded
    echo "Данные загружены"
else
    echo "Данные уже загружены или dump.json не найден, пропускаем"
fi

daphne -b 0.0.0.0 -p 8000 --root-path /api olympiad.asgi:application