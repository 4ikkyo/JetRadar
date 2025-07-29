# api/scheduler.py
import json
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
import logging
import httpx  # Для запросов к TonAPI
from datetime import datetime, timedelta

# Импорты из вашего проекта
from db.db_init import async_session
from db.models import Wallet, Transaction
from sqlalchemy import select, update


load_dotenv()

# Настройка логгера
logger = logging.getLogger("api.scheduler")
# logging.basicConfig(level=logging.INFO) # Уже должно быть настроено в main.py или wallets.py

TONAPI_BASE_URL = "https://tonapi.io/v2"  # Перенести в конфиг или .env если нужно
TONAPI_KEY = os.getenv("TONAPI_KEY")  # Убедитесь, что TONAPI_KEY доступен


# --- Функции для выполнения задач ---


async def fetch_and_store_wallet_activity(wallet_id: int, wallet_address: str):
    """
    Запрашивает активность (события/транзакции) для одного кошелька из TonAPI
    и сохраняет новые транзакции в локальную БД.
    Обновляет метаданные кошелька (last_activity_ts, total_tx_count).
    """
    if not TONAPI_KEY:
        logger.error(f"TONAPI_KEY не установлен. Пропуск обновления для {wallet_address}")
        return

    logger.info(f"Обновление активности для кошелька {wallet_address} (ID: {wallet_id})")
    headers = {"Authorization": f"Bearer {TONAPI_KEY}"}
    # Запрашиваем достаточное количество событий, чтобы покрыть период с последнего обновления
    # Можно использовать before_lt из последней сохраненной транзакции, но это усложнит первый запрос
    # Пока запрашиваем N последних, а потом фильтруем по event_id
    events_limit = 25  # Сколько событий запрашивать за раз

    url = f"{TONAPI_BASE_URL}/accounts/{wallet_address}/events?limit={events_limit}"

    new_transactions_count = 0
    latest_event_ts = None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            events = data.get("events", [])

        if not events:
            logger.info(f"Нет новых событий для {wallet_address}")
            # Обновим время последней проверки баланса/активности, даже если событий нет
            async with async_session() as session:
                async with session.begin():
                    await session.execute(
                        update(Wallet)
                        .where(Wallet.id == wallet_id)
                        .values(last_balance_updated_at=datetime.utcnow())  # Обновляем как время проверки
                    )
            return

        async with async_session() as session:
            async with session.begin():
                # Получаем существующие event_ids для этого кошелька, чтобы не дублировать
                existing_event_ids_result = await session.execute(
                    select(Transaction.event_id).where(Transaction.wallet_id == wallet_id)
                )
                existing_event_ids = {row[0] for row in existing_event_ids_result}

                parsed_transactions_to_add = []
                for event in events:
                    event_id = event.get("event_id")
                    if event_id in existing_event_ids:
                        continue  # Пропускаем уже сохраненное событие

                    # Обновляем latest_event_ts для данного кошелька
                    if latest_event_ts is None or event.get("timestamp", 0) > latest_event_ts:
                        latest_event_ts = event.get("timestamp", 0)

                    parsed_transactions_to_add.append(
                        Transaction(
                            wallet_id=wallet_id,
                            event_id=event_id,
                            lt=event.get("lt"),
                            timestamp=event.get("timestamp"),
                            is_scam_event=event.get("is_scam", False),
                            actions_json=json.dumps(event.get("actions", [])),  # Сохраняем actions как JSON строку
                        )
                    )
                    new_transactions_count += 1

                if parsed_transactions_to_add:
                    session.add_all(parsed_transactions_to_add)
                    logger.info(f"Сохранено {new_transactions_count} новых транзакций для {wallet_address}")

                # Обновляем метаданные кошелька
                wallet_update_values = {
                    "last_balance_updated_at": datetime.utcnow()
                }  # Время последней успешной проверки
                if latest_event_ts:
                    wallet_update_values["last_activity_ts"] = latest_event_ts

                # Запрос общего количества транзакций (может быть неточным если событий > лимита)
                # Более точный способ - запросить /accounts/{account_id} и взять оттуда stats.tx_count
                # Пока оставим так или запросим отдельно.
                # Для примера, можно запросить account info:
                account_info_url = f"{TONAPI_BASE_URL}/accounts/{wallet_address}"
                acc_resp = await client.get(account_info_url, headers=headers)
                if acc_resp.status_code == 200:
                    acc_data = acc_resp.json()
                    wallet_update_values["last_balance_ton"] = int(acc_data.get("balance", 0))  # nanoTONs
                    # wallet_update_values["total_tx_count"] = acc_data.get("stats", {}).get("tx_count", 0) # Если TonAPI предоставляет
                    if not wallet_update_values.get("last_activity_ts") and acc_data.get("last_activity"):
                        wallet_update_values["last_activity_ts"] = acc_data.get("last_activity")
                    if acc_data.get("is_scam") is not None:
                        wallet_update_values["is_scam"] = acc_data.get("is_scam")

                await session.execute(update(Wallet).where(Wallet.id == wallet_id).values(**wallet_update_values))

    except httpx.HTTPStatusError as e:
        logger.error(
            f"Ошибка TonAPI при обновлении {wallet_address} (ID: {wallet_id}): {e.response.status_code} - {e.response.text}"
        )
    except Exception as e:
        logger.error(
            f"Непредвиденная ошибка при обновлении {wallet_address} (ID: {wallet_id}): {str(e)}", exc_info=True
        )


async def scheduled_wallet_updates():
    """
    Основная задача планировщика: проходит по всем кошелькам,
    которые давно не обновлялись, и запускает для них fetch_and_store_wallet_activity.
    """
    logger.info("Запуск планового обновления кошельков...")
    async with async_session() as session:
        # Выбираем кошельки, которые не обновлялись, например, последние 10 минут
        # Или все кошельки, если их немного
        ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)

        wallets_to_update_result = await session.execute(
            select(Wallet.id, Wallet.address).where(
                (Wallet.last_balance_updated_at.is_(None)) | (Wallet.last_balance_updated_at < ten_minutes_ago)
            )
            # .order_by(Wallet.last_balance_updated_at.asc().nulls_first()) # Обновляем самые старые сначала
            # .limit(20) # Ограничиваем количество кошельков за один проход, чтобы не перегружать TonAPI
        )
        wallets_to_update = wallets_to_update_result.all()

    if not wallets_to_update:
        logger.info("Нет кошельков, требующих немедленного обновления.")
        return

    logger.info(f"Найдено {len(wallets_to_update)} кошельков для обновления.")
    for wallet_id, wallet_address in wallets_to_update:
        try:
            await fetch_and_store_wallet_activity(wallet_id, wallet_address)
        except Exception as e:  # Ловим ошибки на уровне отдельного кошелька
            logger.error(
                f"Ошибка при обработке кошелька {wallet_address} в scheduled_wallet_updates: {e}", exc_info=True
            )


# --- Настройка и запуск планировщика ---
# SQLAlchemyJobStore требует синхронный DSN, но мы можем его не использовать для SQLite в памяти,
# либо указать тот же DATABASE_URL, если APScheduler поддерживает его асинхронный диалект.
# Проще всего для SQLite использовать MemoryJobStore или указать путь к файлу БД для SQLAlchemyJobStore.
# Для SQLite с aiosqlite, SQLAlchemyJobStore может потребовать синхронный DSN.
# Упростим: для SQLite используем MemoryJobStore. Для PostgreSQL можно SQLAlchemyJobStore.
# jobstores = {
#     'default': SQLAlchemyJobStore(url=DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")) # Попытка использовать тот же файл
# }
# executors = {
#     'default': {'type': 'threadpool', 'max_workers': 10}, # По умолчанию
#     'async': {'type': 'asyncio'} # Для асинхронных задач
# }
# job_defaults = {
#     'coalesce': False,
#     'max_instances': 3 # Максимум 3 экземпляра одной задачи одновременно
# }

scheduler = AsyncIOScheduler(
    # jobstores=jobstores, # Раскомментировать и настроить для персистентных задач
    # timezone="UTC" # Или ваша локальная таймзона
)


def init_scheduler():
    """Инициализирует и запускает задачи планировщика."""
    if not TONAPI_KEY:
        logger.warning("TONAPI_KEY не установлен. Фоновые задачи обновления кошельков не будут запущены.")
        return False

    # Добавляем задачу периодического обновления кошельков
    # Например, каждые 5 минут
    scheduler.add_job(
        scheduled_wallet_updates,
        trigger="interval",
        minutes=5,  # Интервал можно вынести в настройки
        id="periodic_wallet_updates",
        replace_existing=True,
        misfire_grace_time=60,  # Секунд, если задача "пропущена"
    )

    # Можно добавить другие задачи, например, очистку старых транзакций
    # scheduler.add_job(cleanup_old_transactions, trigger='cron', day_of_week='sun', hour=3)

    try:
        scheduler.start()
        logger.info("Планировщик задач запущен.")
        return True
    except Exception as e:
        logger.error(f"Ошибка при запуске планировщика: {e}", exc_info=True)
        return False


# Функция для остановки планировщика (вызывать при завершении работы API)
def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Планировщик задач остановлен.")
