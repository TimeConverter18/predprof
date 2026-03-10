# Документация WebSocket API

## Базовый URL
- **Разработка**: `ws://127.0.0.1:8000`
- **Продакшен**: `wss://your-domain.com`

---

## Endpoints (Конечные точки)

### 1. Поиск противника (Matchmaking)

**URL**: `ws://127.0.0.1:8000/ws/pvp/`

**Описание**: WebSocket для поиска противника в режиме PVP

**Аутентификация**: Обязательна (пользователь должен быть авторизован)

#### Сообщения Клиент → Сервер

**Начать поиск**
```json
{
  "type": "is_search",
  "is_search": true,
  "subject": "math"
}
```

**Поля**:
- `type` (string, обязательно): Должно быть `"is_search"`
- `is_search` (boolean, обязательно): `true` для начала поиска
- `subject` (string, обязательно): Тип предмета (например, `"math"`)

#### Сообщения Сервер → Клиент

**Матч найден**
```json
{
  "type": "room_id",
  "room_id": 123
}
```

**Поля**:
- `type` (string): `"room_id"`
- `room_id` (integer): ID созданной игровой комнаты

#### Процесс подключения
1. Подключиться к WebSocket
2. Отправить запрос на поиск с указанием предмета
3. Ждать нахождения противника
4. Получить `room_id` когда противник найден
5. Перенаправить на `/pvp/{room_id}/`

#### Коды ошибок
- `4001`: Пользователь не авторизован
- Соединение закрывается если пользователь отключился до начала матча

---

### 2. Игровая комната PVP

**URL**: `ws://127.0.0.1:8000/ws/pvp/<room_id>/`

**Описание**: WebSocket для игры в PVP матче

**Аутентификация**: Обязательна (пользователь должен быть участником этого раунда)

**Параметры**:
- `room_id` (integer): ID раунда/матча из matchmaking

#### Сообщения Клиент → Сервер

**Отправить ответ**
```json
{
  "type": "answer",
  "task_index": 0,
  "answer": "42"
}
```

**Поля**:
- `type` (string, обязательно): Должно быть `"answer"`
- `task_index` (integer, обязательно): Индекс задачи (начиная с 0, от 0 до 2)
- `answer` (string, обязательно): Ответ пользователя

#### Сообщения Сервер → Клиент

**Статистика после ответа** *(отправляется когда оба игрока ответили на текущую задачу)*
```json
{
  "type": "stats",
  "completion_percentage": 33,
  "correct_percentage": 100,
  "enemy_correct_percentage": 0,
  "current_task": 1
}
```

**Раунд завершён**
```json
{
  "type": "ws_finish_round",
  "my_delta": 10,
  "my_old_rating": 1200,
  "my_new_rating": 1210,
  "enemy_delta": -10,
  "enemy_old_rating": 1190,
  "enemy_new_rating": 1180
}
```

**Ошибка**
```json
{
  "type": "error",
  "errors": "Сообщение об ошибке"
}
```

**Поля `stats`**:
- `type` (string): `"stats"`
- `completion_percentage` (integer): Процент выполненных задач (от числа ответивших)
- `correct_percentage` (integer): Процент правильных ответов текущего пользователя
- `enemy_correct_percentage` (integer): Процент правильных ответов противника
- `current_task` (integer): Номер последней отвеченной задачи

**Поля `ws_finish_round`**:
- `type` (string): `"ws_finish_round"`
- `my_delta` (integer): Изменение рейтинга текущего пользователя (положительное — победа, отрицательное — поражение)
- `my_old_rating` (integer): Рейтинг до раунда
- `my_new_rating` (integer): Рейтинг после раунда
- `enemy_delta` (integer): Изменение рейтинга противника
- `enemy_old_rating` (integer): Рейтинг противника до раунда
- `enemy_new_rating` (integer): Рейтинг противника после раунда

**Поля `error`**:
- `type` (string): `"error"`
- `errors` (string): Сообщение об ошибке

#### Процесс подключения
1. Подключиться с `room_id` из matchmaking
2. Отправлять ответы на задачи (0–2), указывая `type: "answer"`
3. Получать сообщение `stats` когда оба игрока ответили на очередную задачу
4. Получить `ws_finish_round` когда оба игрока выполнили все задачи — содержит итоговые рейтинги
5. Соединение закрывается автоматически

#### Коды ошибок
- `4001`: Пользователь не авторизован
- `4004`: Раунд не найден или пользователь не является участником раунда
- `4009`: Противник не найден

---

### 3. Тренировочная сессия

**URL**: `ws://127.0.0.1:8000/ws/training/<training_id>/`

**Описание**: WebSocket для сольного режима тренировки

**Аутентификация**: Обязательна (пользователь должен быть владельцем этой тренировки)

**Параметры**:
- `training_id` (integer): ID тренировочной сессии из `/trainings/api/start_training/`

#### Сообщения Клиент → Сервер

**Отправить ответ**
```json
{
  "task_index": 0,
  "answer": "42"
}
```

**Поля**:
- `task_index` (integer, обязательно): Индекс задачи (начиная с 0, от 0 до 2)
- `answer` (string, обязательно): Ответ пользователя

#### Сообщения Сервер → Клиент

**Результат**
```json
{
  "type": "result",
  "task_index": 0,
  "is_correct": true
}
```

**Тренировка завершена**
```json
{
  "type": "finish_round",
  "message": "Тренировка завершена!"
}
```

**Поля `result`**:
- `type` (string): `"result"`
- `task_index` (integer): Индекс задачи
- `is_correct` (boolean): Правильный ли ответ

**Поля `finish_round`**:
- `type` (string): `"finish_round"`
- `message` (string): Сообщение о завершении (`"Тренировка завершена!"`)

#### Процесс подключения
1. Создать тренировку через `POST /trainings/api/start_training/`
2. Подключиться с `training_id` из ответа
3. Отправлять ответы на задачи (0–2)
4. Получать `result` для каждого отправленного ответа
5. Получить `finish_round` когда все задачи выполнены
6. Соединение закрывается автоматически

#### Коды ошибок
- `4001`: Пользователь не авторизован
- `4003`: Пользователь не имеет доступа к этой тренировке
- `4004`: Тренировка не найдена

---

## Общие шаблоны

### Индексация задач
Все endpoints используют **индексацию с 0** для задач:
- Задача 1 → `task_index: 0`
- Задача 2 → `task_index: 1`
- Задача 3 → `task_index: 2`

### Формат ответа
Ответы всегда отправляются как **строки**, независимо от фактического типа ответа.

### Состояния соединения
1. **Connecting**: WebSocket устанавливает соединение
2. **Open**: Соединение установлено, готово к отправке/получению
3. **Closing**: Соединение закрывается
4. **Closed**: Соединение закрыто

---

## Пример на JavaScript

```javascript
// Поиск противника
const searchSocket = new WebSocket('ws://127.0.0.1:8000/ws/pvp/');

searchSocket.onopen = () => {
  searchSocket.send(JSON.stringify({
    type: 'is_search',
    is_search: true,
    subject: 'math'
  }));
};

searchSocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'room_id') {
    window.location.href = `/pvp/${data.room_id}/`;
  }
};

// PVP игра
const gameSocket = new WebSocket('ws://127.0.0.1:8000/ws/pvp/123/');

gameSocket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'stats') {
    console.log(`Выполнено: ${data.completion_percentage}%`);
    console.log(`Правильных у тебя: ${data.correct_percentage}%`);
    console.log(`Правильных у противника: ${data.enemy_correct_percentage}%`);
  } else if (data.type === 'ws_finish_round') {
    console.log(`Раунд завершён! Изменение рейтинга: ${data.my_delta > 0 ? '+' : ''}${data.my_delta}`);
    console.log(`Новый рейтинг: ${data.my_new_rating}`);
  } else if (data.type === 'error') {
    console.error(`Ошибка: ${data.errors}`);
  }
};

// Отправить ответ (обязательно указывать type: "answer")
gameSocket.send(JSON.stringify({
  type: 'answer',
  task_index: 0,
  answer: '42'
}));

// Тренировка
const trainingSocket = new WebSocket('ws://127.0.0.1:8000/ws/training/1/');

trainingSocket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'result') {
    console.log(`Задача ${data.task_index}: ${data.is_correct ? 'верно' : 'неверно'}`);
  } else if (data.type === 'finish_round') {
    console.log(data.message); // "Тренировка завершена!"
  }
};

trainingSocket.send(JSON.stringify({
  task_index: 0,
  answer: '42'
}));
```

---

## Примечания

- Все WebSocket соединения требуют аутентификации пользователя
- Соединения автоматически закрываются после завершения раунда/тренировки
- Индексы задач начинаются с 0 (0, 1, 2)
- В PVP обязательно передавать `type: "answer"` при отправке ответа — иначе придёт ошибка `"Неизвестный тип сообщения"`
- В тренировке поле `type` при отправке не требуется
- Сообщение о завершении тренировки имеет тип `finish_round` (не `finish_training`)
- Всегда обрабатывайте ошибки соединения и логику переподключения
- WebSocket соединения закрываются по таймауту при отсутствии активности
