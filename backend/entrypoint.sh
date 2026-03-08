# entrypoint.sh
python manage.py migrate

python manage.py shell -c "
from users.models import User
if not User.objects.filter(email='admin@mail.ru').exists():
    User.objects.create_superuser(email='admin@mail.ru', username='admin', password='123456')
    print('Суперпользователь создан')
else:
    print('Суперпользователь уже существует')
"

if [ -f /app/dump.json ]; then
    python manage.py flush --no-input
    python manage.py loaddata /app/dump.json
    echo "Данные загружены"
else
    echo "dump.json не найден, пропускаем"
fi

daphne -b 0.0.0.0 -p 8000 --root-path /api olympiad.asgi:application