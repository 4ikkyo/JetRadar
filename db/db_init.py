import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from .models import Base # Используем относительный импорт, если models.py в том же каталоге

# Определяем путь к корневому каталогу проекта
# Это предполагает, что db_init.py находится в подкаталоге 'db' корневого каталога проекта
PROJECT_ROOT = Path(__file__).parent.parent
ENV_PATH = PROJECT_ROOT / '.env'

# Загружаем переменные окружения из .env файла
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"INFO:     Загружены переменные окружения из {ENV_PATH}")
else:
    print(f"WARN:     Файл .env не найден по пути {ENV_PATH}. Используются системные переменные окружения или значения по умолчанию.")

# Получаем DATABASE_URL из переменных окружения
# Предоставляем значение по умолчанию, если переменная не установлена,
# и создаем директорию 'data', если она не существует.
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "data.db"
if not DEFAULT_DB_PATH.parent.exists():
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"INFO:     Создана директория {DEFAULT_DB_PATH.parent}")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DEFAULT_DB_PATH.resolve()}")
print(f"INFO:     Используется DATABASE_URL: {DATABASE_URL}")


# echo=True полезно для отладки SQL-запросов, можно установить в False для продакшена
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

async def init_db():
    """
    Создает все таблицы (если еще не существуют).
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("INFO:     Схема базы данных инициализирована/проверена.")