# JetRadar

JetRadar — це бот і API для моніторингу активності TON-гаманців. Складається з двох частин:

1. **FastAPI-сервіс (api/)**
   – Ендпойнти для отримання історії транзакцій (TonAPI) і побудови графа.

2. **Telegram-бот (bot/)**
   – Хендлери `/start`, `/add`, `/list`, `/tx`.
   – Використовує FastAPI на бекенді.

### Як розгорнути

1. **Клонуйте репозиторій** і зайдіть у папку:
   ```bash
   git clone <url репозиторію>
   cd JetRadar
   ```
2. **Скопіюйте зразок файлу `.env.example` і відредагуйте значення:**
   ```bash
   cp .env.example .env
   # відкрийте .env та заповніть свої дані
   ```
3. **Створіть віртуальне середовище** та активуйте його:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
4. **Встановіть залежності**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Запустіть API**:
   ```bash
   uvicorn api.main:app --reload
   ```
6. **Запустіть Telegram-бота** в іншій консолі:
   ```bash
   python bot/main.py
   ```

Перед запуском переконайтесь, що в змінних середовища або файлі `.env` задані `BOT_TOKEN` та `TONAPI_KEY`.
