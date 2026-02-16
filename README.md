# Платформа для подготовки к олимпиадам

## Инновационная платформа для подготовки к олимпиадам: банк заданий, тренировки, PVP-дуэли в реальном времени и статистика.

---

## 🔗 Ссылки

- **Продакшн:** [predprof.kzhivaev.ru](https://predprof.kzhivaev.ru/)
- **Админ-панель:** [predprof.kzhivaev.ru](https://predprof.kzhivaev.ru/)
- **Демонстрация:** [Видео Rutube]()

### 🔑 Тестовый доступ (Администратор)
- **Логин:** `admin@example.com`
- **Пароль:** `admin`

---

## 🛠 Стек

- **Frontend:** React 19, TypeScript, Vite, Ant Design, Axios
- **Backend:** Python 3.12+, Django, Django Channels (WebSockets)
- **Infrastructure:** PostgreSQL, Redis, Nginx
- **DevOps:** Docker, Docker Compose

---

## 🚀 Быстрый запуск (Docker)

Проект полностью контейнеризирован. Запуск всех компонентов (Frontend, Backend, DB, Redis, Nginx) выполняется через Docker Compose.

1. **Клонируйте репозиторий:**
   ```bash
   mkdir predprof
   cd predprof
   git clone https://github.com/TimeConverter18/olympiad
   ```

2. **Настройте окружение:**
   Создайте файл `.env` в корне проекта:
   ```env
   DEBUG=False
   SECRET_KEY=
   ALLOWED_HOSTS=localhost,127.0.0.1,

   POSTGRES_DB=
   POSTGRES_USER=
   POSTGRES_PASSWORD=
   DB_HOST=
   DB_PORT=5432

   REDIS_URL=redis://redis-pr:6379/0
   CHANNELS_REDIS_URL=redis://redis-pr:6379/1
   ```

3. **Запустите проект:**
   ```bash
   docker compose up --build
   ```

Приложение будет доступно по адресу: `http://localhost`