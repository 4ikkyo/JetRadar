# bot/main.py

import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties

from config import BOT_TOKEN
from bot.commands import router as command_router
from db.db_init import init_db

logging.basicConfig(level=logging.INFO)

# Ініціалізуємо бота
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher(storage=MemoryStorage())


async def main():
    # Створюємо таблиці в БД (якщо ще не існують)
    await init_db()

    # Підключаємо маршрутизатор (хендлери)
    dp.include_router(command_router)

    # Запускаємо polling
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
