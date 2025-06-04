# bot/handlers/commands.py

import httpx # Используем httpx для асинхронных запросов
from aiogram import Router, types
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import Command
from datetime import datetime
import logging
from config import BACKEND_URL as API_BASE_URL

bot_logger = logging.getLogger(__name__) # Логгер для команд бота
logging.basicConfig(level=logging.INFO) # Убедитесь, что логирование настроено

# API_BASE_URL определяется в config.py и указывает на адрес запущенного FastAPI сервера

router = Router()

@router.message(Command("start")) # Более явное использование Command фильтра
async def start_command(message: Message):
    # При старте можно также зарегистрировать/проверить пользователя через API,
    # но команда /add уже будет это делать.
    # Пока оставим просто приветствие.
    await message.answer(
        "👋 Привіт! Це JetRadar — система моніторингу гаманців TON.\n"
        "Щоб додати гаманець у Watchlist, напиши:\n"
        "<code>/add АДРЕСА_ГАМАНЦЯ [Метка кошелька]</code>\n"
        "Або скористайся нашим веб-додатком для зручного управління!",
        parse_mode="HTML"
    )

@router.message(Command("add"))
async def add_wallet_via_api(message: Message):
    args = message.text.split(maxsplit=2) # /add ADDRESS ALIAS
    if len(args) < 2:
        await message.answer(
            "❗ Будь ласка, вкажіть адресу гаманця: <code>/add &lt;TON-адреса&gt; [Метка]</code>",
            parse_mode="HTML"
        )
        return

    address = args[1].strip()
    alias = args[2].strip() if len(args) > 2 else None

    # Валидация адреса (очень базовая)
    if not (address.startswith("UQ") or address.startswith("EQ")) or len(address) < 48:
         await message.answer("❗ Схоже, це недійсна адреса TON гаманця.", parse_mode="HTML")
         return

    user_id = message.from_user.id
    # Получаем имя пользователя для передачи в API (на случай, если пользователь новый для API)
    username = message.from_user.username or f"{message.from_user.first_name} {message.from_user.last_name or ''}".strip()

    payload = {
        "telegram_user_id": user_id,
        "address": address,
        "alias": alias,
        "username": username # API использует это, если нужно создать пользователя
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{API_BASE_URL}/wallet/add", json=payload)

            response_data = None
            try:
                # Попытка разобрать JSON в любом случае, чтобы увидеть, что пришло
                response_data = response.json()
            except Exception:
                bot_logger.error(
                    f"Не удалось разобрать JSON из ответа API. Статус: {response.status_code}. Тело: {response.text}",
                    exc_info=True)
                await message.answer(
                    f"⚠️ Отримана неструктурована відповідь від API (статус {response.status_code}).\n"
                    f"Тіло відповіді: <code>{response.text[:1000]}</code>",  # Показываем часть ответа
                    parse_mode="HTML"
                )
                return

            if response.status_code == 201:  # Created
                await message.answer(
                    f"✅ Гаманець <code>{address}</code>" + (
                        f" з меткою \"{response_data.get('alias', alias)}\"" if response_data.get('alias',
                                                                                                  alias) else "") + " додано до твого Watchlist.",
                    parse_mode="HTML"
                )
            elif response.status_code == 409:  # Conflict
                await message.answer(
                    f"⚠️ Гаманець <code>{address}</code> вже є у твоєму Watchlist.\nДеталі: {response_data.get('detail', '')}",
                    parse_mode="HTML")
            else:  # Другие ошибки от API (4xx, 5xx), которые вернули JSON
                error_detail = response_data.get('detail', str(response_data))  # Пытаемся получить 'detail'
                await message.answer(
                    f"⚠️ Помилка при додаванні гаманця через API ({response.status_code}):\n<code>{error_detail}</code>",
                    parse_mode="HTML")

        except httpx.ConnectError as e:  # Ошибка соединения с API
            bot_logger.error(f"Помилка з'єднання з API: {str(e)}")
            await message.answer(
                f"❌ Помилка з'єднання з API ({API_BASE_URL}). Перевірте, чи запущено API сервер та чи доступний він.")
        except httpx.RequestError as e:  # Другие ошибки httpx
            bot_logger.error(f"Загальна помилка запиту до API: {str(e)}", exc_info=True)
            await message.answer(f"❌ Помилка запиту до API: {str(e)}")
        except Exception as e:
            bot_logger.error(f"Непередбачена помилка в команді /add: {str(e)}", exc_info=True)
            await message.answer(f"❌ Непередбачена помилка в боті: {str(e)}")


@router.message(Command("list"))
async def list_wallets_via_api(message: Message):
    user_id = message.from_user.id

    async with httpx.AsyncClient() as client:
        try:
            params = {"telegram_user_id": user_id}
            response = await client.get(f"{API_BASE_URL}/wallet", params=params)

            if response.status_code == 200:
                wallets_data = response.json()
                if not wallets_data:
                    await message.answer("ℹ️ Твій Watchlist порожній. Додай гаманець командою <code>/add</code>.", parse_mode="HTML")
                    return

                text_lines = ["<b>🧾 Твій Watchlist:</b>"]
                for i, w_data in enumerate(wallets_data, 1):
                    addr_short = f"{w_data['address'][:6]}...{w_data['address'][-4:]}"
                    line = f"{i}. <code>{addr_short}</code>"
                    if w_data['alias']:
                        line += f" — <i>{w_data['alias']}</i>"
                    if w_data['group']:
                        line += f" [{w_data['group']}]"
                    text_lines.append(line)
                await message.answer("\n".join(text_lines), parse_mode="HTML")
            else:
                error_detail = response.json().get('detail', response.text)
                await message.answer(f"⚠️ Помилка отримання списку гаманців ({response.status_code}):\n<code>{error_detail}</code>", parse_mode="HTML")
        except httpx.RequestError as e:
            await message.answer(f"❌ Помилка з'єднання з API: {str(e)}")
        except Exception as e:
            await message.answer(f"❌ Непередбачена помилка: {str(e)}")


@router.message(Command("tx"))
async def tx_history_via_api(message: types.Message):
    parts = message.text.strip().split()
    if len(parts) < 2:
        await message.answer("❗ Введіть адресу гаманця: <code>/tx &lt;адреса&gt; [ліміт]</code>\nНаприклад: <code>/tx EQ... 5</code>", parse_mode="HTML")
        return

    address = parts[1]
    limit = 5 # Значение по умолчанию для лимита
    if len(parts) > 2 and parts[2].isdigit():
        limit = int(parts[2])
        if not (1 <= limit <= 20): # Ограничение лимита для API
            await message.answer("❗ Ліміт транзакцій має бути від 1 до 20.", parse_mode="HTML")
            return

    async with httpx.AsyncClient() as client:
        try:
            # Эндпоинт API /wallet/{address}/history теперь принимает limit как query параметр
            api_url = f"{API_BASE_URL}/wallet/{address}/history?limit={limit}"
            resp = await client.get(api_url)

            if resp.status_code != 200:
                error_detail = resp.json().get('detail', resp.text)
                await message.answer(f"⚠️ Помилка API ({resp.status_code}) при запиті історії:\n<code>{error_detail}</code>", parse_mode="HTML")
                return

            events_data = resp.json()
        except httpx.RequestError as e:
            await message.answer(f"❌ Помилка з'єднання з API при запиті історії: {str(e)}")
            return
        except Exception as e:
            await message.answer(f"❌ Непередбачена помилка при запиті історії: {str(e)}")
            return

    if not events_data:
        await message.answer(f"📭 Для гаманця <code>{address}</code> не знайдено транзакцій (за лімітом {limit}).", parse_mode="HTML")
        return

    text_blocks = [f"📒 Останні транзакції для <code>{address}</code> (до {limit}):"]

    for event in events_data:
        ts = event.get("timestamp", 0)
        dt_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S UTC") if ts else "N/A"
        event_lines = [f"\n🗓️ {dt_str} (ID: {event.get('event_id', 'N/A')[:10]}...)"]
        if event.get("is_scam"):
            event_lines.append("🚨 <b>SCAM Event!</b>")

        for action in event.get("actions", []):
            action_type = action.get("type", "UnknownType")
            status = action.get("status", "N/A")
            desc = action.get("description", "")
            line = f"— {action_type} ({status})"
            if desc:
                line += f": {desc}"


            if action_type == "TON Transfer":
                val = action.get("amount_ton", 0)
                direction = "📤 OUT" if action.get("is_send") else "📥 IN"
                line = f"💸 {direction} {val:.4f} TON"
                if action.get('comment'):
                    line += f" ({action.get('comment')})"
            elif action_type == "Jetton Transfer":
                val = action.get("amount", 0)
                sym = action.get("jetton_symbol", "JTN")
                direction = "📤 OUT" if action.get("is_send") else "📥 IN"
                line = f"🪙 {direction} {val:.2f} {sym}"
            elif action_type == "NFT Transfer":
                name = action.get("nft_name", "NFT")
                direction = "📤 OUT" if action.get("is_send") else "📥 IN"
                line = f"🖼️ {direction} {name}"
            elif action_type == "Swap":
                line = (
                    f"🔄 Swap: {action.get('amount_in', 0):.2f} {action.get('asset_in')}"
                    f" → {action.get('amount_out', 0):.2f} {action.get('asset_out')}"
                )
                if action.get('dex'):
                    line += f" via {action.get('dex')}"

            event_lines.append(f"  {line}")

        text_blocks.append("\n".join(event_lines))

    full_message = "\n".join(text_blocks)
    # Telegram имеет ограничение на длину сообщения
    if len(full_message) > 4096:
        full_message = full_message[:4090] + "\n[...]"
    await message.answer(full_message, parse_mode="HTML", disable_web_page_preview=True)


@router.message(Command("summary"))
async def wallet_summary_via_api(message: Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("❗ Будь ласка, вкажіть адресу гаманця: <code>/summary &lt;TON-адреса&gt;</code>",
                             parse_mode="HTML")
        return
    address = args[1].strip()

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{API_BASE_URL}/wallet/{address}/summary",
                params={"telegram_user_id": message.from_user.id},
            )

            if response.status_code == 200:
                summary = response.json()
                text = f"<b>📊 Зведення по гаманцю:</b> <code>{summary['address']}</code>\n"
                if summary.get('alias'):
                    text += f"<b>Метка:</b> <i>{summary['alias']}</i>\n"
                if summary.get('group'):
                    text += f"<b>Група:</b> [{summary['group']}]\n"
                if summary.get('balance_ton') is not None:
                    text += f"<b>Баланс TON:</b> {summary['balance_ton']:.4f}💎\n"
                if summary.get('total_tx_count') is not None:
                    text += (
                        f"<b>Всього транзакцій (збережено):</b> {summary['total_tx_count']}\n"
                    )
                if summary.get('first_activity_ts'):
                    text += (
                        f"<b>Перша активність:</b> {datetime.utcfromtimestamp(summary['first_activity_ts']).strftime('%Y-%m-%d %H:%M')}\n"
                    )
                if summary.get('last_activity_ts'):
                    text += (
                        f"<b>Остання активність:</b> {datetime.utcfromtimestamp(summary['last_activity_ts']).strftime('%Y-%m-%d %H:%M')}\n"
                    )
                if summary.get('is_scam') is not None:
                    text += f"<b>Scam:</b> {'🔴 Так' if summary['is_scam'] else '🟢 Ні'}\n"
                await message.answer(text, parse_mode="HTML")
            else:
                # ... (обработка ошибок как в /add)
                error_detail = "Невідома помилка"
                try:
                    error_detail = response.json().get('detail', response.text)
                except Exception:
                    error_detail = response.text[:200]
                await message.answer(
                    f"⚠️ Помилка отримання зведення ({response.status_code}):\n<code>{error_detail}</code>",
                    parse_mode="HTML")
        # ... (обработка httpx ошибок)
        except httpx.ConnectError as e:
            bot_logger.error(f"Помилка з'єднання з API для /summary: {str(e)}")
            await message.answer(f"❌ Помилка з'єднання з API ({API_BASE_URL}).")
        except Exception as e:
            bot_logger.error(f"Непередбачена помилка в /summary: {str(e)}", exc_info=True)
            await message.answer(f"❌ Непередбачена помилка: {str(e)}")


@router.message(Command("search"))
async def search_wallets_command(message: Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("❗ Введіть запит для пошуку: <code>/search &lt;текст&gt;</code>", parse_mode="HTML")
        return
    query_text = args[1].strip()

    async with httpx.AsyncClient() as client:
        try:
            params = {"telegram_user_id": message.from_user.id, "query": query_text}
            response = await client.get(f"{API_BASE_URL}/wallet/wallets/search", params=params)  # Исправлен URL

            if response.status_code == 200:
                results = response.json()
                if not results:
                    await message.answer(f"ℹ️ Нічого не знайдено за запитом \"{query_text}\".")
                    return
                text = f"<b>🔍 Результати пошуку за \"{query_text}\":</b>\n"
                for res_wallet in results:
                    text += f"• <code>{res_wallet['address']}</code>"
                    if res_wallet.get('alias'):
                        text += f" (<i>{res_wallet['alias']}</i>)"
                    if res_wallet.get('group'):
                        text += f" [{res_wallet['group']}]"
                    text += "\n"
                await message.answer(text, parse_mode="HTML")
            # ... (обработка ошибок)
            else:
                error_detail = "Невідома помилка"
                try:
                    error_detail = response.json().get('detail', response.text)
                except Exception:
                    error_detail = response.text[:200]
                await message.answer(f"⚠️ Помилка пошуку ({response.status_code}):\n<code>{error_detail}</code>",
                                     parse_mode="HTML")
        # ... (обработка httpx ошибок)
        except httpx.ConnectError as e:
            bot_logger.error(f"Помилка з'єднання з API для /search: {str(e)}")
            await message.answer(f"❌ Помилка з'єднання з API ({API_BASE_URL}).")
        except Exception as e:
            bot_logger.error(f"Непередбачена помилка в /search: {str(e)}", exc_info=True)
            await message.answer(f"❌ Непередбачена помилка: {str(e)}")


# Команды для экспорта и графа могут быть сложнее для отображения в боте (особенно граф).
# Экспорт может просто давать ссылку или отправлять файл.
# Граф лучше смотреть в WebApp.

@router.message(Command("export"))
async def export_history_command(message: Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("❗ Вкажіть адресу гаманця для експорту: <code>/export &lt;адреса&gt;</code>",
                             parse_mode="HTML")
        return
    address = args[1].strip()

    # Можно добавить выбор формата через аргумент команды или Inline-кнопки
    # Пока просто JSON или ссылка на CSV
    export_format = "csv"  # или "json"

    api_url = f"{API_BASE_URL}/wallet/{address}/history/export?format={export_format}"
    # Для бота может быть лучше, если API вернет JSON с данными,
    # а бот сам сформирует файл и отправит, либо отправит ссылку на скачивание,
    # если API может отдавать файл напрямую (что и делает Response с Content-Disposition)

    await message.answer(f"Готую експорт історії для <code>{address}</code> у форматі {export_format}...\n"
                         f"Ви можете завантажити його за прямим посиланням (якщо API налаштовано для цього):\n"
                         f"{api_url}\n\n"
                         f"<i>(Для автоматичного надсилання файлу ботом потрібна додаткова реалізація.)</i>",
                         parse_mode="HTML", disable_web_page_preview=True)


@router.message(Command("graph"))
async def show_graph_command(message: Message):
    # Команда /graph [адрес] [глубина]
    # Для простоты, пока просто ссылка на WebApp с параметрами для графа
    args = message.text.split()
    target_address = args[1] if len(args) > 1 else None
    # depth = args[2] if len(args) > 2 and args[2].isdigit() else 1 # пока не используем

    web_app_url = "https://4ikkyo.github.io/JetRadar/"  # ВАШ URL WebApp
    graph_params = f"?telegram_user_id={message.from_user.id}"
    if target_address:
        graph_params += f"&graph_target={target_address}"

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🕸️ Відкрити граф у WebApp", web_app=WebAppInfo(url=f"{web_app_url}{graph_params}"))]
    ])
    await message.answer(
        "Для перегляду графа зв'язків, будь ласка, відкрийте веб-додаток:",
        reply_markup=keyboard
    )

@router.message(Command("webapp"))
async def send_webapp_button(message: Message):
    # Убедитесь, что URL вашего WebApp правильный и доступен
    # Для локальной разработки с GitHub Pages может потребоваться ngrok или аналогичный туннель,
    # если Telegram требует HTTPS для WebApp, а GitHub Pages его предоставляет.
    web_app_url = "https://4ikkyo.github.io/JetRadar/" # Ваш URL
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🚀 Відкрити JetRadar WebApp",
                web_app=WebAppInfo(url=web_app_url)
            )
        ]
    ])
    await message.answer("Натисни кнопку нижче, щоб відкрити інтерактивну версію JetRadar:", reply_markup=keyboard)
