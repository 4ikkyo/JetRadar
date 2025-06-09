from datetime import datetime

from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import select
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import logging  # <--- Добавляем logging
import json  # Для работы с actions_json
from fastapi import Response  # Для экспорта
from sqlalchemy.orm import selectinload
from typing import List, Optional  # Для типизации
import csv
import io  # Для экспорта CSV

from db.models import User, Wallet, UserWallet, Transaction
from db.db_init import async_session

load_dotenv()

# Настройка логгера для текущего файла
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)  # Устанавливаем базовый уровень логирования

router = APIRouter()

TONAPI_KEY = os.getenv("TONAPI_KEY")
TONAPI_BASE_URL = "https://tonapi.io/v2"


async def fetch_from_tonapi(url: str) -> httpx.Response:
    """Виконує GET-запит до TonAPI та обробляє помилки."""
    headers = {"Authorization": f"Bearer {TONAPI_KEY}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError as e:
            detail = f"TonAPI error {e.response.status_code}"
            try:
                data = e.response.json()
                if "error" in data:
                    detail += f": {data['error']}"
                else:
                    detail += f": {e.response.text}"
            except Exception:
                detail += f": {e.response.text}"
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Network error: {str(e)}")


class WalletSummary(BaseModel):
    address: str
    alias: Optional[str] = None
    group: Optional[str] = None
    balance_ton: Optional[float] = None  # В TON, не nanoTON
    last_activity_ts: Optional[int] = None
    first_activity_ts: Optional[int] = None
    total_tx_count: Optional[int] = None
    is_scam: Optional[bool] = None
    # Можно добавить информацию о Jetton-балансах
    # jettons: List[dict] = []


class NodeMeta(BaseModel):
    user_label: Optional[str] = None
    in_tx_count: int = 0
    out_tx_count: int = 0
    total_ton_in: float = 0
    total_ton_out: float = 0
    # Можно добавить first_seen_as_counterparty, last_seen_as_counterparty


class GraphNode(BaseModel):
    id: str  # address
    label: str
    meta: Optional[NodeMeta] = None
    # Дополнительные поля для vis.js (например, color, shape)
    color: Optional[str] = None
    shape: Optional[str] = None
    value: Optional[int] = None  # Например, для размера узла (по объему транзакций)


class GraphEdge(BaseModel):
    from_node: str  # FastAPI не любит 'from' как имя поля, используем from_node
    to_node: str  # FastAPI не любит 'to' как имя поля, используем to_node
    value: Optional[int] = None  # Например, количество транзакций
    label: Optional[str] = None  # Например, "TON: 450" или "5 txs"
    title: Optional[str] = None  # Подсказка при наведении
    arrows: Optional[str] = "to"


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    message: Optional[str] = None


class WalletRequestBase(BaseModel):
    telegram_user_id: int
    username: str | None = None


class AddWalletRequest(WalletRequestBase):
    address: str
    alias: str | None = None
    group: str | None = None


# ... (остальные модели Pydantic без изменений) ...
class UpdateWalletLabelRequest(WalletRequestBase):
    alias: str | None = None
    group: str | None = None


class ActionResponse(BaseModel):
    type: str
    status: str
    description: str

    # --- Поля для TonTransfer ---
    sender: Optional[str] = None
    recipient: Optional[str] = None
    amount_ton: Optional[float] = None
    comment: Optional[str] = None
    is_send: Optional[bool] = None

    # --- Поля для JettonTransfer (### ИЗМЕНЕНО) ---
    amount: Optional[float] = None
    jetton_symbol: Optional[str] = None
    jetton_name: Optional[str] = None  # ### новое поле
    jetton_address: Optional[str] = None  # ### из исходных данных
    jetton_image: Optional[str] = None  # ### URL картинки токена
    # (например, jetton_info["metadata"]["image"] или ["logo"])

    # --- Можно добавить для NFT и других ---
    # nft_name: Optional[str] = None
    # nft_address: Optional[str] = None

    # Swap-поля, если нужно
    ton_in: Optional[float] = None
    amount_out: Optional[float] = None
    dex: Optional[str] = None
    is_swap: Optional[bool] = None
    # asset_in: Optional[str] = None
    # amount_in: Optional[float] = None
    # asset_out: Optional[str] = None
    # и т. д.


class EventResponse(BaseModel):
    timestamp: int
    event_id: str
    is_scam: bool
    lt: int
    actions: List[ActionResponse]


@router.get("/{address}/summary", response_model=WalletSummary, summary="Получить сводку кошелька")
async def get_wallet_summary(address: str, telegram_user_id: int = Query(...)):
    """
    Возвращает:
      - address, alias, group из БД (если кошелёк есть в watchlist);
      - баланс (balance_ton) и last_activity_ts из TonAPI;
      - first_activity_ts и total_tx_count из БД (если ранее сохранились);
      - is_scam из TonAPI (или из БД, если хотите).
    """

    # 1) Сначала проверим, есть ли пользователь в базе (чтобы он имел доступ)
    async with async_session() as session:
        user = await session.scalar(select(User).where(User.telegram_id == telegram_user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2) Ищем связку Wallet + UserWallet, чтобы получить alias и group, если кошелёк есть в watchlist
        stmt = (
            select(Wallet, UserWallet.alias, UserWallet.group)
            .outerjoin(UserWallet, (UserWallet.wallet_id == Wallet.id) & (UserWallet.user_id == user.id))
            .where(Wallet.address == address)
        )
        result = await session.execute(stmt)
        row = result.first()

        alias = None
        group = None
        first_activity_ts = None
        total_tx_count = None
        db_is_scam = None

        if row:
            db_wallet, alias, group = row
            # Если нужно, возьмём из БД first_activity_ts и total_tx_count
            first_activity_ts = db_wallet.first_activity_ts
            total_tx_count = db_wallet.total_tx_count
            # При желании можно брать is_scam из БД (если вы заранее сохраняете его при добавлении)
            db_is_scam = db_wallet.is_scam

    # 3) Теперь _всегда_ делаем запрос к TonAPI → /accounts/{address} для актуального баланса и last_activity
    if not TONAPI_KEY:
        raise HTTPException(status_code=503, detail="TONAPI_KEY not set")

    resp = await fetch_from_tonapi(f"{TONAPI_BASE_URL}/accounts/{address}")

    acc_data = resp.json()
    # Из TonAPI получаем:
    #   balance  (в нанотонах) → делим на 1e9
    #   last_activity (Unix-timestamp)
    #   is_scam     (булево)
    # Если хотите, можно также забрать из acc_data первые сведения о транзакциях, но в этом методе нам достаточно баланса

    ton_balance_raw = acc_data.get("balance", 0) or 0
    balance_ton = int(ton_balance_raw) / 1_000_000_000
    last_activity_ts = acc_data.get("last_activity")  # может быть None или int
    api_is_scam = acc_data.get("is_scam", False)

    # 4) Формируем и возвращаем WalletSummary
    return WalletSummary(
        address=address,
        alias=alias,
        group=group,
        balance_ton=balance_ton,
        last_activity_ts=last_activity_ts,
        first_activity_ts=first_activity_ts,
        total_tx_count=total_tx_count,
        # Если в БД уже записан is_scam → используем его, иначе берём из TonAPI
        is_scam=(db_is_scam if db_is_scam is not None else api_is_scam),
    )


@router.get("/wallets/search", response_model=List[dict], summary="Поиск кошельков в Watchlist пользователя")
async def search_user_wallets(telegram_user_id: int = Query(...), query: str = Query(..., min_length=3)):
    """
    Ищет кошельки в Watchlist пользователя по адресу, метке или группе.
    """
    async with async_session() as session:
        user = await session.scalar(select(User).where(User.telegram_id == telegram_user_id))
        if not user:
            return []  # Пользователь не найден

        search_query = f"%{query.lower()}%"

        result = await session.execute(
            select(Wallet.address, UserWallet.alias, UserWallet.group)
            .join(UserWallet, Wallet.id == UserWallet.wallet_id)
            .where(UserWallet.user_id == user.id)
            .where(
                (Wallet.address.ilike(search_query))
                | (UserWallet.alias.ilike(search_query))
                | (UserWallet.group.ilike(search_query))
            )
            .limit(20)  # Ограничиваем результаты
        )

        found_wallets = result.all()
        return [{"address": r.address, "alias": r.alias, "group": r.group} for r in found_wallets]


@router.get("/{address}/history/export", summary="Экспорт истории транзакций кошелька")
async def export_wallet_history(address: str, format: str = Query("json", enum=["json", "csv"])):
    """
    Экспортирует историю транзакций для заданного адреса кошелька в формате JSON или CSV.
    Данные берутся из локально сохраненных транзакций.
    """
    async with async_session() as session:
        wallet = await session.scalar(select(Wallet).where(Wallet.address == address))
        if not wallet:
            raise HTTPException(status_code=404, detail=f"Кошелек {address} не найден в локальной базе.")

        # Загружаем транзакции для этого кошелька
        transactions_result = await session.execute(
            select(Transaction)
            .where(Transaction.wallet_id == wallet.id)
            .order_by(Transaction.timestamp.desc())
            # .limit(1000) # Опционально: ограничить количество экспортируемых транзакций
        )
        transactions = transactions_result.scalars().all()

        if not transactions:
            if format == "json":
                return {"message": "Нет транзакций для экспорта.", "transactions": []}
            else:  # csv
                return Response("Нет транзакций для экспорта.", media_type="text/plain")

        export_data = []
        for tx in transactions:
            actions = json.loads(tx.actions_json)  # Десериализуем actions
            # Упрощенное представление для экспорта - можно детализировать
            for action_idx, action in enumerate(actions):
                export_data.append(
                    {
                        "event_id": tx.event_id,
                        "timestamp": datetime.utcfromtimestamp(tx.timestamp).isoformat() if tx.timestamp else None,
                        "lt": tx.lt,
                        "action_index": action_idx,
                        "action_type": action.get("type"),
                        "action_status": action.get("status"),
                        "action_description": (
                            (action.get("simple_preview") or action.get("simplePreview", {})).get("description")
                            if isinstance(action.get("simple_preview") or action.get("simplePreview"), dict)
                            else str(action.get("simple_preview") or action.get("simplePreview", ""))
                        ),
                        # Можно добавить больше полей из action в зависимости от типа
                    }
                )

        if format == "json":
            return {"address": address, "transactions": export_data}

        elif format == "csv":
            output = io.StringIO()
            if not export_data:  # Если после разбора actions ничего нет
                return Response(
                    "Нет данных для CSV экспорта.",
                    media_type="text/plain",
                )

            writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
            writer.writeheader()
            writer.writerows(export_data)

            return Response(
                output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=history_{address}.csv"},
            )
    raise HTTPException(status_code=400, detail="Неподдерживаемый формат экспорта.")


@router.get("/graph", response_model=GraphResponse, summary="Построить граф связей для кошельков пользователя")
async def get_connection_graph_api(
    telegram_user_id: int = Query(...),
    depth: int = Query(1, ge=1, le=2, description="Глубина анализа связей (1 или 2)"),
    target_address: Optional[str] = Query(
        None,
        description="Центральный адрес для графа (если не указан, используются все из Watchlist)",
    ),
    incoming: bool = Query(True, description="Включать входящие транзакции"),
    outgoing: bool = Query(True, description="Включать исходящие транзакции"),
    jetton_only: bool = Query(False, description="Только JettonTransfer"),
    min_value: float = Query(0.0, description="Мин. сумма TON/Jetton для ребра"),
):
    """
    Строит граф связей.
    Если target_address указан, граф строится вокруг него.
    Иначе, граф показывает связи между кошельками в Watchlist пользователя и их прямыми контрагентами.
    Использует локально сохраненные транзакции.
    """
    nodes_dict = {}  # address -> GraphNode
    edges_list = []  # список GraphEdge

    async with async_session() as session:
        user = await session.scalar(select(User).where(User.telegram_id == telegram_user_id))
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # 1. Определяем начальные узлы (root_nodes)
        root_wallet_addresses = set()
        if target_address:
            # Проверяем, есть ли такой кошелек в системе (не обязательно в watchlist пользователя)
            wallet_check = await session.scalar(select(Wallet.address).where(Wallet.address == target_address))
            if not wallet_check:
                raise HTTPException(status_code=404, detail=f"Целевой адрес {target_address} не найден в системе.")
            root_wallet_addresses.add(target_address)
        else:
            # Берем все кошельки из watchlist пользователя
            user_wallets_q = await session.execute(
                select(Wallet.address, UserWallet.alias)
                .join(UserWallet, Wallet.id == UserWallet.wallet_id)
                .where(UserWallet.user_id == user.id)
            )
            for uw_addr, uw_alias in user_wallets_q.all():
                root_wallet_addresses.add(uw_addr)
                nodes_dict[uw_addr] = GraphNode(
                    id=uw_addr,
                    label=uw_alias or f"{uw_addr[:6]}...",
                    shape="box",  # Кошельки из watchlist - квадраты
                    color="#FFD700",  # Золотой
                    meta=NodeMeta(user_label=uw_alias),
                )

        if not root_wallet_addresses:
            return GraphResponse(nodes=[], edges=[], message="Нет кошельков для построения графа.")

        # 2. Собираем транзакции для root_nodes (и их контрагентов, если depth > 0)
        #    Это упрощенная логика, для реальной глубины > 1 потребуется рекурсивный сбор или более сложный запрос.
        #    Для MVP (depth=1) достаточно транзакций, где root_node является отправителем или получателем.

        current_level_addresses = set(root_wallet_addresses)
        processed_addresses = set()  # Для избежания циклов и повторной обработки

        for _ in range(depth):  # Итерации по глубине
            if not current_level_addresses:
                break

            addresses_to_query_this_level = list(current_level_addresses - processed_addresses)
            if not addresses_to_query_this_level:
                break

            processed_addresses.update(addresses_to_query_this_level)
            next_level_addresses = set()

            # Получаем ID кошельков для запроса транзакций
            wallet_ids_q = await session.execute(
                select(Wallet.id, Wallet.address, UserWallet.alias)
                .outerjoin(UserWallet, (Wallet.id == UserWallet.wallet_id) & (UserWallet.user_id == user.id))
                .where(Wallet.address.in_(addresses_to_query_this_level))
            )
            wallet_id_map = {res.address: (res.id, res.alias) for res in wallet_ids_q.all()}

            if not wallet_id_map:
                continue  # Нет таких кошельков в нашей БД

            db_transactions_q = await session.execute(
                select(Transaction, Wallet.address.label("source_wallet_address"))
                .join(Wallet, Transaction.wallet_id == Wallet.id)
                .where(Wallet.id.in_([w_id for w_id, _ in wallet_id_map.values()]))
                .order_by(Transaction.timestamp.desc())
                .limit(len(wallet_id_map) * 20)  # Ограничение на общее кол-во транзакций для анализа
            )

            for tx, source_wallet_addr in db_transactions_q.all():
                actions = json.loads(tx.actions_json)
                for action in actions:
                    # Упрощенный анализ: ищем TonTransfer или JettonTransfer
                    sender, recipient = None, None
                    amount_str = ""
                    amount_val = 0.0

                    if action.get("type") == "TonTransfer":
                        transfer = action.get("TonTransfer", {})
                        sender = transfer.get("sender", {}).get("address")
                        recipient = transfer.get("recipient", {}).get("address")
                        amount_val = int(transfer.get("amount", 0)) / 1e9
                        amount_str = f"{amount_val:.2f} TON"
                    elif action.get("type") == "JettonTransfer":
                        transfer = action.get("JettonTransfer", {})
                        sender = transfer.get("sender", {}).get("address")
                        recipient = transfer.get("recipient", {}).get("address")
                        jetton_info = transfer.get("jetton", {})
                        decimals = int(jetton_info.get("decimals", 9) or 9)
                        amount_val = int(transfer.get("amount", 0)) / (10**decimals)
                        amount_str = f"{amount_val:.2f} {jetton_info.get('symbol', 'JTN')}"

                    if sender and recipient:
                        if jetton_only and action.get("type") != "JettonTransfer":
                            continue
                        if amount_val < min_value:
                            continue
                        if not incoming and recipient in root_wallet_addresses:
                            continue
                        if not outgoing and sender in root_wallet_addresses:
                            continue
                        # Добавляем узлы, если их еще нет
                        for addr in [sender, recipient]:
                            if addr not in nodes_dict:
                                # Является ли этот адрес одним из root_nodes?
                                is_root_node_related = addr in root_wallet_addresses
                                nodes_dict[addr] = GraphNode(
                                    id=addr,
                                    label=f"{addr[:6]}...",
                                    shape="ellipse" if not is_root_node_related else "box",  # Обычные эллипсы
                                    color="#97C2FC" if not is_root_node_related else "#FFD700",  # Голубой
                                    meta=NodeMeta(),
                                )
                            # Обновляем метаданные узлов
                            if addr == sender:
                                nodes_dict[addr].meta.out_tx_count += 1
                                if action.get("type") == "TonTransfer":
                                    nodes_dict[addr].meta.total_ton_out += amount_val
                            if addr == recipient:
                                nodes_dict[addr].meta.in_tx_count += 1
                                if action.get("type") == "TonTransfer":
                                    nodes_dict[addr].meta.total_ton_in += amount_val

                        # Добавляем ребро
                        edges_list.append(
                            GraphEdge(
                                from_node=sender,
                                to_node=recipient,
                                label=amount_str,
                                title=f"{action.get('type')}\n{amount_str}\nEvent: {tx.event_id[:10]}...\nTime: {datetime.utcfromtimestamp(tx.timestamp).strftime('%Y-%m-%d %H:%M')}",
                                # value=1 # Можно увеличить, если несколько транзакций между теми же узлами
                            )
                        )

                        # Добавляем контрагентов на следующий уровень обработки, если глубина позволяет
                        if sender not in processed_addresses and sender not in current_level_addresses:
                            next_level_addresses.add(sender)
                        if recipient not in processed_addresses and recipient not in current_level_addresses:
                            next_level_addresses.add(recipient)

            current_level_addresses = next_level_addresses  # Переход на следующий уровень

    # Преобразуем словарь узлов в список
    final_nodes = list(nodes_dict.values())
    # Опционально: убрать изолированные узлы, если они не из root_set
    # ...

    if not edges_list:
        # Если локальная база пуста, попробуем взять последние события из TonAPI
        for addr in root_wallet_addresses:
            try:
                tonapi_events = await get_wallet_history_from_tonapi(addr, limit=5)
            except Exception:
                continue
            for event in tonapi_events:
                for act in event.get("actions", []):
                    sender = None
                    recipient = None
                    amount_str = ""
                    act_type = act.get("type")
                    if act_type == "TonTransfer":
                        sender = act.get("sender")
                        recipient = act.get("recipient")
                        amount_val = act.get("amount_ton") or 0
                        amount_str = f"{amount_val:.2f} TON"
                    elif act_type == "JettonTransfer":
                        sender = act.get("sender")
                        recipient = act.get("recipient")
                        amount_val = act.get("amount") or 0
                        amount_str = f"{amount_val:.2f} {act.get('jetton_symbol', '')}"
                    if sender and recipient:
                        if jetton_only and act_type != "JettonTransfer":
                            continue
                        if amount_val < min_value:
                            continue
                        if not incoming and recipient in root_wallet_addresses:
                            continue
                        if not outgoing and sender in root_wallet_addresses:
                            continue
                        for a in [sender, recipient]:
                            if a not in nodes_dict:
                                nodes_dict[a] = GraphNode(
                                    id=a,
                                    label=f"{a[:6]}...",
                                    color="#97C2FC",
                                    shape="ellipse",
                                    meta=NodeMeta(),
                                )
                        nodes_dict[sender].meta.out_tx_count += 1
                        nodes_dict[recipient].meta.in_tx_count += 1
                        edges_list.append(
                            GraphEdge(
                                from_node=sender,
                                to_node=recipient,
                                label=amount_str,
                                title=amount_str,
                            )
                        )
        final_nodes = list(nodes_dict.values())

    if not final_nodes and not edges_list:
        return GraphResponse(
            nodes=[], edges=[], message="Не удалось найти транзакции для построения графа по заданным параметрам."
        )

    return GraphResponse(nodes=final_nodes, edges=edges_list)


# Не забудьте добавить logging и обработку ошибок в новые эндпоинты, как в /add


@router.post("/add", status_code=201, summary="Добавить кошелек в Watchlist пользователя")
async def add_wallet_to_user_watchlist(item: AddWalletRequest):
    """Добавляет кошелек в список наблюдения пользователя.

    Сначала проверяет наличие связки ``UserWallet``. Если она уже существует,
    возвращает ошибку ``409``. Только убедившись в ее отсутствии, открывает
    транзакцию и создает недостающие записи.
    """
    try:
        async with async_session() as session:
            # Получаем пользователя и кошелек, если они уже есть в БД
            user = await session.scalar(select(User).where(User.telegram_id == item.telegram_user_id))
            wallet = await session.scalar(select(Wallet).where(Wallet.address == item.address))

            if user and wallet:
                link = await session.scalar(
                    select(UserWallet).where(
                        UserWallet.user_id == user.id,
                        UserWallet.wallet_id == wallet.id,
                    )
                )
                if link:
                    logger.warning(
                        f"Попытка повторного добавления: Кошелек {item.address} уже в Watchlist для пользователя {item.telegram_user_id}"
                    )
                    raise HTTPException(
                        status_code=409,
                        detail=f"Кошелек {item.address} уже в Watchlist для пользователя {item.telegram_user_id}",
                    )

            # Открываем транзакцию только после проверки отсутствия ссылки
            async with session.begin():
                if not user:
                    logger.info(
                        f"Создание нового пользователя: telegram_id={item.telegram_user_id}, username='{item.username}'"
                    )
                    user = User(
                        telegram_id=item.telegram_user_id,
                        username=item.username or f"user_{item.telegram_user_id}",
                    )
                    session.add(user)
                    await session.flush()

                if not wallet:
                    logger.info(f"Создание нового кошелька: address='{item.address}'")
                    wallet = Wallet(address=item.address)
                    session.add(wallet)
                    await session.flush()

                # Повторная проверка на случай гонки добавлений
                link = await session.scalar(
                    select(UserWallet).where(
                        UserWallet.user_id == user.id,
                        UserWallet.wallet_id == wallet.id,
                    )
                )
                if link:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Кошелек {item.address} уже в Watchlist для пользователя {item.telegram_user_id}",
                    )

                logger.info(f"Создание связи UserWallet для user_id={user.id} и wallet_id={wallet.id}")
                uw = UserWallet(
                    user_id=user.id,
                    wallet_id=wallet.id,
                    alias=item.alias,
                    group=item.group,
                )
                session.add(uw)
                await session.flush()

            logger.info(
                f"Успешно добавлен кошелек {wallet.address} (alias: '{uw.alias}') для пользователя {user.telegram_id}"
            )
            return {
                "message": "Кошелек успешно добавлен",
                "user_wallet_id": uw.id,
                "address": wallet.address,
                "alias": uw.alias,
                "group": uw.group,
            }
    except HTTPException:
        raise # Перехватываем и снова вызываем HTTPException, чтобы FastAPI обработал его корректно
    except Exception as e:
        # Логируем полную трассировку ошибки на стороне сервера
        logger.error(f"Критическая ошибка в /wallet/add: {str(e)}", exc_info=True)
        # Возвращаем клиенту общее сообщение об ошибке в формате JSON
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера при обработке вашего запроса. Администратор уведомлен. ({type(e).__name__})"
        )


@router.get("", summary="Получить Watchlist пользователя")  # Путь "" относительно префикса /wallet
async def get_user_watchlist(telegram_user_id: int = Query(...)):
    """
    Возвращает список кошельков (адрес, метка, группа) из Watchlist пользователя.
    """
    async with async_session() as session:
        user = await session.scalar(select(User).where(User.telegram_id == telegram_user_id))
        if not user:
            # Можно вернуть 404 или пустой список, если пользователь не найден.
            # Для WebApp пустой список может быть предпочтительнее.
            return []
            # raise HTTPException(status_code=404, detail=f"Пользователь с ID {telegram_user_id} не найден")

        result = await session.execute(
            select(UserWallet)
            .where(UserWallet.user_id == user.id)
            .options(selectinload(UserWallet.wallet))  # Загружаем связанные данные кошелька
        )
        user_wallets = result.scalars().all()

        return [
            {
                "address": uw.wallet.address,
                "alias": uw.alias or "",  # Возвращаем пустую строку, если None
                "group": uw.group or "",  # Возвращаем пустую строку, если None
            }
            for uw in user_wallets
        ]


@router.post("/{address}/label", summary="Обновить метку и/или группу кошелька")
async def update_wallet_label_api(address: str, item: UpdateWalletLabelRequest):
    """
    Обновляет метку (alias) и/или группу для кошелька в Watchlist пользователя.
    """
    async with async_session() as session:
        user = await session.scalar(select(User).where(User.telegram_id == item.telegram_user_id))
        if not user:
            raise HTTPException(status_code=404, detail=f"Пользователь с ID {item.telegram_user_id} не найден")

        wallet = await session.scalar(select(Wallet).where(Wallet.address == address))
        if not wallet:
            # Обычно, если пользователь редактирует метку, кошелек уже должен быть в системе.
            # Если нет, то это ошибка данных или UI.
            raise HTTPException(status_code=404, detail=f"Кошелек с адресом {address} не найден в глобальном списке")

        user_wallet = await session.scalar(
            select(UserWallet).where(UserWallet.user_id == user.id).where(UserWallet.wallet_id == wallet.id)
        )

        if not user_wallet:
            raise HTTPException(
                status_code=404, detail=f"Кошелек {address} не найден в Watchlist пользователя {item.telegram_user_id}"
            )

        updated_fields = False
        if item.alias is not None:
            user_wallet.alias = item.alias
            updated_fields = True
        if item.group is not None:  # Позволяет установить пустую строку для сброса группы
            user_wallet.group = item.group
            updated_fields = True

        if updated_fields:
            await session.commit()
            await session.refresh(user_wallet)  # Обновить данные из БД
            return {
                "message": "Метка/группа кошелька успешно обновлена",
                "address": address,
                "alias": user_wallet.alias,
                "group": user_wallet.group,
            }
        else:
            return {
                "message": "Нет данных для обновления",
                "address": address,
                "alias": user_wallet.alias,
                "group": user_wallet.group,
            }


@router.get(
    "/{address}/history",
    response_model=List[EventResponse],
    summary="Получить историю транзакций кошелька (через TonAPI)",
)
async def get_wallet_history_from_tonapi(address: str, limit: int = Query(5, ge=1, le=50)):
    """
    Получает историю событий (операций) для заданного адреса кошелька,
    используя TonAPI. Возвращает массив событий,
    каждое событие содержит список actions с расширенными полями.
    """
    if not TONAPI_KEY:
        raise HTTPException(status_code=500, detail="TONAPI_KEY не установлен в окружении.")

    url = f"{TONAPI_BASE_URL}/accounts/{address}/events?limit={limit}"
    response = await fetch_from_tonapi(url)

    data = response.json()
    events = data.get("events", [])
    parsed_transactions = []

    for event in events:
        event_info = {
            "timestamp": event.get("timestamp"),
            "event_id": event.get("event_id"),
            "is_scam": event.get("is_scam", False),
            "lt": event.get("lt", 0),
            "actions": [],
        }

        for action in event.get("actions", []):
            action_type = action.get("type")
            status = action.get("status")  # "ok" или "failed"
            simple_preview = action.get("simple_preview") or action.get("simplePreview", {})
            action_details = {
                "type": action_type,
                "status": status,
                "description": simple_preview.get("description", ""),
            }

            # === Уже существующие ветки ===
            if action_type == "TonTransfer":
                transfer = action.get("TonTransfer", {})
                sender_addr = transfer.get("sender", {}).get("address")
                recipient_addr = transfer.get("recipient", {}).get("address")
                raw_amount = transfer.get("amount", 0) or 0
                try:
                    amount_ton = int(raw_amount) / 1_000_000_000
                except (ValueError, TypeError):
                    amount_ton = 0.0

                action_details.update(
                    {
                        "sender": sender_addr,
                        "recipient": recipient_addr,
                        "amount_ton": amount_ton,
                        "comment": transfer.get("comment"),
                        "is_send": (sender_addr == address) if sender_addr else False,
                    }
                )

            elif action_type == "JettonTransfer":
                transfer = action.get("JettonTransfer", {})
                sender_addr = transfer.get("sender", {}).get("address")
                recipient_addr = transfer.get("recipient", {}).get("address")
                jetton_info = transfer.get("jetton", {})
                decimals = int(jetton_info.get("decimals", 9) or 9)
                try:
                    amount_jetton = int(transfer.get("amount", 0)) / (10**decimals)
                except (ValueError, TypeError):
                    amount_jetton = 0.0

                action_details.update(
                    {
                        "sender": sender_addr,
                        "recipient": recipient_addr,
                        "amount": amount_jetton,
                        "jetton_symbol": jetton_info.get("symbol", "Unknown Jetton"),
                        "jetton_name": jetton_info.get("name", ""),
                        "jetton_address": jetton_info.get("address"),
                        "jetton_image": jetton_info.get("metadata", {}).get("image")
                        or jetton_info.get("metadata", {}).get("logo"),
                        "is_send": (sender_addr == address) if sender_addr else False,
                    }
                )

            # --- Обработка NFT Transfer (пример) ---
            elif action_type in ("NFT Transfer", "NftTransfer", "NftItemTransfer"):
                # TON API может использовать разные структуры
                nft_transfer = action.get("NftItemTransfer") or action.get("NftTransfer", {})
                sender_addr = nft_transfer.get("sender", {}).get("address")
                recipient_addr = nft_transfer.get("recipient", {}).get("address")
                nft_metadata = nft_transfer.get("nft", {}) or nft_transfer.get("item", {})
                action_details.update(
                    {
                        "sender": sender_addr,
                        "recipient": recipient_addr,
                        "nft_address": nft_metadata.get("address"),
                        "nft_name": nft_metadata.get("metadata", {}).get("name", ""),
                        "is_send": (sender_addr == address) if sender_addr else False,
                    }
                )

            # --- Обработка Swap (пример) ---
            elif action_type == "Swap":
                swap_data = action.get("Swap", {})
                dex = swap_data.get("dex")
                amount_in_str = swap_data.get("amount_in", "0")
                amount_out_str = swap_data.get("amount_out", "0")
                asset_in_info = swap_data.get("asset_in")
                asset_out_info = swap_data.get("asset_out")

                def parse_asset(asset_info, raw_amount_str):
                    # Если это строка "ton" или объект для Jetton
                    if isinstance(asset_info, str) and asset_info.lower() == "ton":
                        try:
                            a = int(raw_amount_str) / 1e9
                        except (ValueError, TypeError):
                            a = 0.0
                        return ("TON", a, None, None)
                    elif isinstance(asset_info, dict):
                        dec = int(asset_info.get("decimals", 9) or 9)
                        try:
                            a = int(raw_amount_str) / (10**dec)
                        except (ValueError, TypeError):
                            a = 0.0
                        return (
                            asset_info.get("symbol", "JETTON"),
                            a,
                            asset_info.get("address"),
                            asset_info.get("metadata", {}).get("image"),
                        )
                    else:
                        return (None, 0.0, None, None)

                asset_in_symbol, amount_in, jetton_in_addr, jetton_in_img = parse_asset(asset_in_info, amount_in_str)
                asset_out_symbol, amount_out, jetton_out_addr, jetton_out_img = parse_asset(
                    asset_out_info, amount_out_str
                )

                action_details.update(
                    {
                        "dex": dex,
                        "amount_in": amount_in,
                        "asset_in": asset_in_symbol,
                        "asset_in_address": jetton_in_addr,
                        "asset_in_image": jetton_in_img,
                        "amount_out": amount_out,
                        "asset_out": asset_out_symbol,
                        "asset_out_address": jetton_out_addr,
                        "asset_out_image": jetton_out_img,
                        "is_send": True,  # По Swap нет смысла «send/receive» – можно определить по direction
                    }
                )

                # ==== ЗДЕСЬ НУЖНО ДОБАВИТЬ НОВУЮ ВЕТКУ ДЛЯ JettonSwap ====
            elif action_type == "JettonSwap":
                swap = action.get("JettonSwap", {})

                # 1) сколько TON ушло (в "нанотонах"):
                raw_ton_in = swap.get("ton_in", 0) or 0
                try:
                    ton_in = int(raw_ton_in) / 1_000_000_000
                except (ValueError, TypeError):
                    ton_in = 0.0

                # 2) сколько джеттона пришло (amount_out в минимальных единицах):
                jm_out = swap.get("jetton_master_out", {})
                raw_amt_out = swap.get("amount_out", "0") or "0"
                decimals = int(jm_out.get("decimals", 9) or 9)
                try:
                    jetton_amount = int(raw_amt_out) / (10**decimals)
                except (ValueError, TypeError):
                    jetton_amount = 0.0

                # 3) символ, имя и картинка джеттона
                jetton_symbol = jm_out.get("symbol", "")
                jetton_name = jm_out.get("name", "")
                jetton_address = jm_out.get("address", "")
                # TonAPI часто кладёт картинку токена в поле image или в metadata.image
                jetton_image = (
                    jm_out.get("image")
                    or jm_out.get("metadata", {}).get("image")
                    or jm_out.get("metadata", {}).get("logo")
                )

                # 4) DEX, через который шел swap (router name)
                router_info = swap.get("router", {})
                dex_name = router_info.get("name", "")

                action_details.update(
                    {
                        "ton_in": ton_in,
                        "amount_out": jetton_amount,
                        "jetton_symbol": jetton_symbol,
                        "jetton_name": jetton_name,
                        "jetton_address": jetton_address,
                        "jetton_image": jetton_image,
                        "dex": dex_name,
                        # Признак swap-операции, чтобы фронтенд легче идентифицировал:
                        "is_swap": True,
                    }
                )
            # --- Остальные типы действий просто ложим в raw_data ---
            else:
                action_details["raw_data"] = simple_preview

            # Добавляем action_details только если есть развёрнутые поля
            event_info["actions"].append(action_details)

        # Если в событии вообще нет ни одного action, пропускаем:
        if event_info["actions"]:
            parsed_transactions.append(event_info)

    return parsed_transactions
