import os
from dotenv import load_dotenv

load_dotenv()

# Токен Telegram-бота
BOT_TOKEN = os.getenv("BOT_TOKEN")

# TONAPI_KEY (просто дубль у корені .env)
TONAPI_KEY = os.getenv("TONAPI_KEY")

BACKEND_URL = "http://127.0.0.1:8000"
