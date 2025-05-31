# db/db_init.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from db.models import Base

# Використовуємо SQLite (для продакшену можна поміняти на PostgreSQL)
DATABASE_URL = "sqlite+aiosqlite:///./data.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

async def init_db():
    """
    Створює всі таблиці (якщо ще не існують) під час старту бота.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
