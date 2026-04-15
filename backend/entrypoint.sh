#!/bin/sh

python manage.py migrate

if [ -f /app/dump.json ] && [ ! -f /app/staticfiles/.data_loaded ]; then
    python manage.py loaddata /app/dump.json
    touch /app/staticfiles/.data_loaded
    echo "Данные загружены"
else
    echo "Данные уже загружены или dump.json не найден, пропускаем"
fi

daphne -b 0.0.0.0 -p 8000 --root-path /api olympiad.asgi:application