# db/models.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint, DECIMAL, Boolean, TEXT
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    wallets = relationship("UserWallet", back_populates="user", cascade="all, delete-orphan")
    # Связь с настройками уведомлений (если будем реализовывать)
    # notification_settings = relationship("NotificationSetting", back_populates="user", cascade="all, delete-orphan")


class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, unique=True, nullable=False, index=True)
    # Дополнительные поля, которые могут обновляться фоново
    last_balance_ton = Column(
        DECIMAL(precision=20, scale=9), nullable=True
    )  # Хранение баланса в nanoTON как Integer или TON как Decimal
    last_balance_updated_at = Column(DateTime, nullable=True)
    first_activity_ts = Column(Integer, nullable=True)  # timestamp первой транзакции
    last_activity_ts = Column(Integer, nullable=True)  # timestamp последней транзакции
    total_tx_count = Column(Integer, default=0)  # Общее количество транзакций (из TonAPI)
    is_scam = Column(Boolean, default=False, nullable=True)
    # Можно добавить поле для последней проверки на скам или других метаданных от TonAPI

    users = relationship("UserWallet", back_populates="wallet")
    transactions = relationship(
        "Transaction", back_populates="wallet", cascade="all, delete-orphan", order_by="desc(Transaction.timestamp)"
    )


class UserWallet(Base):
    __tablename__ = "user_wallets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    alias = Column(String, index=True)  # Индексируем для поиска
    group = Column(String, index=True)  # Индексируем для поиска
    # Настройки уведомлений для конкретного кошелька пользователя
    # notify_on_large_tx = Column(Boolean, default=False)
    # notify_threshold_ton = Column(DECIMAL(precision=20, scale=9), nullable=True)

    user = relationship("User", back_populates="wallets")
    wallet = relationship("Wallet", back_populates="users")

    __table_args__ = (UniqueConstraint("user_id", "wallet_id", name="_user_wallet_uc"),)


class Transaction(Base):  # Новая таблица для локального хранения транзакций
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(
        Integer, ForeignKey("wallets.id"), nullable=False, index=True
    )  # К какому из НАШИХ отслеживаемых кошельков относится
    event_id = Column(String, unique=True, nullable=False, index=True)  # Уникальный ID события из TonAPI
    lt = Column(String, nullable=False)  # Логическое время транзакции (важно для сортировки и уникальности)
    timestamp = Column(Integer, nullable=False, index=True)  # UNIX timestamp
    is_scam_event = Column(Boolean, default=False)

    # Сохраняем все действия в JSON, так как их структура может быть разнообразной
    actions_json = Column(TEXT, nullable=False)  # JSON строка со списком actions из события TonAPI

    # Обобщенные поля для быстрого доступа и фильтрации (можно заполнять при сохранении)
    # main_action_type = Column(String, nullable=True) # Тип основного действия (TonTransfer, JettonTransfer и т.д.)
    # involved_address = Column(String, nullable=True, index=True) # Основной контрагент (если применимо)

    wallet = relationship("Wallet", back_populates="transactions")

    __table_args__ = (
        UniqueConstraint("wallet_id", "event_id", name="_wallet_event_uc"),
        # Можно добавить индекс по timestamp для более быстрых запросов по дате
        # Index('ix_transaction_timestamp', 'timestamp'),
    )


# Таблица для настроек уведомлений (если нужно будет более гранулировано)
# class NotificationSetting(Base):
#     __tablename__ = 'notification_settings'
#     id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True) # Один набор настроек на пользователя
#     # global_notify_on_large_tx = Column(Boolean, default=False)
#     # global_notify_threshold_ton = Column(DECIMAL(precision=20, scale=9), nullable=True)
#     user = relationship("User", back_populates="notification_settings")
