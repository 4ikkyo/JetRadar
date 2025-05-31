# bot/handlers/commands.py

import httpx
from aiogram import Router, F, types
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from sqlalchemy import select
from db.models import User, Wallet, UserWallet
from db.db_init import async_session
from sqlalchemy.orm import selectinload
from aiogram.filters import Command
import aiohttp
from datetime import datetime

API_BASE_URL = "http://127.0.0.1:8000"

router = Router()

@router.message(F.text == "/start")
async def start_command(message: Message):
    await message.answer(
        "👋 Привіт! Це JetRadar — система моніторингу гаманців TON.\n"
        "Напиши <code>/add адреса</code>, щоб додати гаманець у Watchlist.",
        parse_mode="HTML"
    )

@router.message(F.text.startswith("/add"))
async def add_wallet(message: Message):
    args = message.text.strip().split()
    if len(args) < 2:
        await message.answer(
            "❗ Вкажи адресу гаманця після команди: <code>/add <TON-адреса></code>",
            parse_mode="HTML"
        )
        return

    address = args[1].strip()
    user_id = message.from_user.id
    username = message.from_user.username or ""

    async with async_session() as session:
        # Перевіряємо, чи вже є користувач
        user = await session.scalar(select(User).where(User.telegram_id == user_id))
        if not user:
            user = User(telegram_id=user_id, username=username)
            session.add(user)
            await session.flush()

        # Перевіряємо, чи існує гаманець в базі
        wallet = await session.scalar(select(Wallet).where(Wallet.address == address))
        if not wallet:
            wallet = Wallet(address=address)
            session.add(wallet)
            await session.flush()

        # Перевіряємо у зв’язку UserWallet, можливо користувач вже додавав цей wallet
        link = await session.scalar(
            select(UserWallet).where(
                UserWallet.user_id == user.id,
                UserWallet.wallet_id == wallet.id
            )
        )
        if link:
            await message.answer("⚠️ Цей гаманець уже є у твоєму Watchlist.")
        else:
            uw = UserWallet(user_id=user.id, wallet_id=wallet.id)
            session.add(uw)
            await session.commit()
            await message.answer(
                f"✅ Адресу <code>{address}</code> додано до твого Watchlist.",
                parse_mode="HTML"
            )

@router.message(F.text == "/list")
async def list_wallets(message: Message):
    user_id = message.from_user.id

    async with async_session() as session:
        # Знайдемо користувача
        user = await session.scalar(select(User).where(User.telegram_id == user_id))
        if not user:
            await message.answer("ℹ️ Ти ще не додавав жодного гаманця.")
            return

        # Завантажуємо всі UserWallet (разом із Wallet через selectinload)
        result = await session.execute(
            select(UserWallet)
            .where(UserWallet.user_id == user.id)
            .options(selectinload(UserWallet.wallet))
        )
        user_wallets = result.scalars().all()

        if not user_wallets:
            await message.answer("ℹ️ У тебе порожній Watchlist.")
            return

        # Формуємо текстовий перелік
        text = "<b>🧾 Твій Watchlist:</b>\n"
        for uw in user_wallets:
            label = f" — <i>{uw.alias}</i>" if uw.alias else ""
            group = f" [{uw.group}]" if uw.group else ""
            text += f"• <code>{uw.wallet.address}</code>{label}{group}\n"
        await message.answer(text, parse_mode="HTML")

@router.message(Command("tx"))
async def tx_history(message: types.Message):
    parts = message.text.strip().split()
    if len(parts) < 2:
        await message.answer("❗ Введіть адресу гаманця: /tx <адреса>")
        return

    address = parts[1]

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{API_BASE_URL}/wallet/{address}/history?limit=5") as resp:
                if resp.status != 200:
                    text = await resp.text()
                    await message.answer(f"⚠️ Помилка API ({resp.status}):\n<code>{text}</code>")
                    return

                data = await resp.json()
        except Exception as e:
            await message.answer(f"❌ Помилка при запиті:\n<code>{str(e)}</code>")
            return

    if not data:
        await message.answer("📭 У цього гаманця немає транзакцій.")
        return

    # Формування тексту
    text_blocks = ["📒 Останні транзакції:"]
    from datetime import datetime

    for tx in data:
        ts = tx.get("timestamp", 0)
        dt = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
        lines = [f"🕓 {dt}"]

        for action in tx.get("actions", []):
            typ = action.get("type", "Unknown")

            if typ == "TON Transfer":
                value = action.get("amount_ton", 0)
                direction = "OUT" if action.get("is_send") else "IN"
                lines.append(f"💸 {direction} TON: {value:.2f} TON")

            elif typ == "Jetton Transfer":
                value = action.get("amount", 0)
                symbol = action.get("jetton_symbol", "Jetton")
                direction = "OUT" if action.get("is_send") else "IN"
                lines.append(f"🔁 {direction} {symbol}: {value:.2f} {symbol}")

            elif typ == "NFT Transfer":
                name = action.get("nft_name", "NFT")
                direction = "OUT" if action.get("is_send") else "IN"
                lines.append(f"🖼 {direction} NFT: {name}")

            elif typ == "Swap":
                lines.append(f"🔄 Swap: {action.get('amount_in', 0)} {action.get('asset_in')} → {action.get('amount_out', 0)} {action.get('asset_out')}")

            else:
                lines.append(f"❔ {typ}")

        text_blocks.append("\n".join(lines))

    await message.answer("\n\n".join(text_blocks))

@router.message(Command("webapp"))
async def send_webapp_button(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🚀 Відкрити JetRadar WebApp",
                web_app=WebAppInfo(url="https://4ikkyo.github.io/JetRadar/")
            )
        ]
    ])
    await message.answer("Відкрий інтерактивну версію JetRadar:", reply_markup=keyboard)