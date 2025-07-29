from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Убедитесь, что пути импорта корректны
from contextlib import asynccontextmanager
from .routes.wallets import router as wallets_router # Убедитесь, что путь правильный
from db.db_init import init_db
from .scheduler import init_scheduler, shutdown_scheduler  # <--- Импорт функций планировщика
import os  # для доступа к TONAPI_KEY

logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API Запуск - Инициализация базы данных...")
    await init_db()
    logger.info("API Запуск - Инициализация базы данных завершена.")

    if os.getenv("TONAPI_KEY"):  # Запускаем планировщик только если есть ключ API
        logger.info("API Запуск - Инициализация планировщика...")
        if init_scheduler():
            logger.info("API Запуск - Планировщик успешно инициализирован.")
        else:
            logger.warning("API Запуск - Планировщик не был запущен (возможно, из-за ошибки или отсутствия TONAPI_KEY).")
    else:
        logger.warning("API Запуск - TONAPI_KEY не найден, планировщик не будет запущен.")

    yield  # <--- Основная часть работы приложения FastAPI

    logger.info("API Завершение работы - Остановка планировщика...")
    shutdown_scheduler()
    logger.info("API Завершение работы - Планировщик остановлен.")


app = FastAPI(
    title="JetRadar API",
    description="API для JetRadar (отримання історії кошельків, управління Watchlist і т.д.)",
    version="0.2.1",
    lifespan=lifespan
)
# Если вы используете более старую версию FastAPI или предпочитаете on_event:
# @app.on_event("startup")
# async def on_startup():
#     print("INFO:     API Запуск - Инициализация базы данных...")
#     await init_db()
#     print("INFO:     API Запуск - Инициализация базы данных завершена.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(wallets_router, prefix="/wallet", tags=["Wallet Operations"])

@app.get("/", tags=["Root"], summary="Корневой эндпоинт для проверки работы API")
async def read_root():
    return {"message": "Welcome to JetRadar API"}
