# db/models.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    username = Column(String)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)

    wallets = relationship("UserWallet", back_populates="user")


class Wallet(Base):
    __tablename__ = 'wallets'
    id = Column(Integer, primary_key=True)
    address = Column(String, unique=True, nullable=False)

    users = relationship("UserWallet", back_populates="wallet")


class UserWallet(Base):
    __tablename__ = 'user_wallets'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    wallet_id = Column(Integer, ForeignKey('wallets.id'))
    alias = Column(String)
    group = Column(String)

    user = relationship("User", back_populates="wallets")
    wallet = relationship("Wallet", back_populates="users")

    __table_args__ = (UniqueConstraint('user_id', 'wallet_id', name='_user_wallet_uc'),)
