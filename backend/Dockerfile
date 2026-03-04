FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

ENV SCRIPT_NAME=/api

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "--root-path", "/api", "olympiad.asgi:application"]