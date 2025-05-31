from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

router = APIRouter()

TONAPI_KEY = os.getenv("TONAPI_KEY")
TONAPI_BASE_URL = "https://tonapi.io/v2"

@router.get("/{address}/history")
async def get_wallet_history(address: str, limit: int = 3):
    """
    Получает историю событий (операций) для заданного адреса кошелька,
    стараясь интерпретировать их в более понятном виде, как это делает TonViewer.
    Мы используем эндпоинт /events, который предоставляет более высокоуровневые данные.
    """
    if not TONAPI_KEY:
        raise HTTPException(status_code=500, detail="TONAPI_KEY не установлен. Пожалуйста, добавьте его в файл .env")

    headers = {
        "Authorization": f"Bearer {TONAPI_KEY}"
    }

    # Используем эндпоинт /events, который часто предоставляет более интерпретируемые данные
    # limit здесь относится к количеству событий, а не сырых транзакций
    url = f"{TONAPI_BASE_URL}/accounts/{address}/events?limit={limit}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status() # Вызывает исключение для статусов 4xx/5xx
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=f"Ошибка TonAPI: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {str(e)}")

    data = response.json()
    events = data.get("events", [])

    parsed_transactions = []

    for event in events:
        # Каждое "событие" может представлять собой несколько операций
        # Например, swap может содержать и отправку TON, и получение токенов.
        # Нам нужно пройти по "actions" внутри каждого события.

        event_info = {
            "timestamp": event.get("timestamp"),
            "event_id": event.get("event_id"),
            "is_scam": event.get("is_scam"),
            "actions": []
        }

        for action in event.get("actions", []):
            action_type = action.get("type")
            action_details = {}

            if action_type == "TonTransfer":
                # Обрабатываем прямой перевод TON
                transfer = action.get("TonTransfer", {})
                action_details = {
                    "type": "TON Transfer",
                    "sender": transfer.get("sender", {}).get("address"),
                    "recipient": transfer.get("recipient", {}).get("address"),
                    "amount_ton": int(transfer.get("amount", 0)) / 1_000_000_000, # Переводим наноТОН в ТОН
                    "comment": transfer.get("comment"),
                    "is_send": transfer.get("sender", {}).get("address") == address # Определяем, отправили или получили
                }
            elif action_type == "JettonTransfer":
                # Обрабатываем перевод Jetton (токенов)
                transfer = action.get("JettonTransfer", {})
                action_details = {
                    "type": "Jetton Transfer",
                    "sender": transfer.get("sender", {}).get("address"),
                    "recipient": transfer.get("recipient", {}).get("address"),
                    "amount": int(transfer.get("amount", 0)) / (10**transfer.get("jetton", {}).get("decimals", 0)), # Учитываем десятичные знаки токена
                    "jetton_symbol": transfer.get("jetton", {}).get("symbol"),
                    "is_send": transfer.get("sender", {}).get("address") == address
                }
            elif action_type == "NftTransfer":
                # Обрабатываем перевод NFT
                transfer = action.get("NftTransfer", {})
                action_details = {
                    "type": "NFT Transfer",
                    "sender": transfer.get("sender", {}).get("address"),
                    "recipient": transfer.get("recipient", {}).get("address"),
                    "nft_name": transfer.get("nft", {}).get("metadata", {}).get("name"),
                    "is_send": transfer.get("sender", {}).get("address") == address
                }
            elif action_type == "Swap":
                # Обрабатываем Swap операции (обмен)
                swap = action.get("Swap", {})
                action_details = {
                    "type": "Swap",
                    "dex": swap.get("dex"),
                    "amount_in": int(swap.get("amount_in", 0)) / 1_000_000_000, # Для TON
                    "asset_in": "TON" if swap.get("asset_in") == "TON" else swap.get("jetton_master_in", {}).get("symbol"),
                    "amount_out": int(swap.get("amount_out", 0)) / 1_000_000_000, # Для TON
                    "asset_out": "TON" if swap.get("asset_out") == "TON" else swap.get("jetton_master_out", {}).get("symbol")
                    # Здесь можно добавить более детальную обработку для других типов активов
                }
            # Добавьте другие типы действий, если необходимо (например, SmartContractExec, ContractDeploy, etc.)
            else:
                # Если тип действия не распознан, просто добавляем общую информацию
                action_details = {
                    "type": action_type,
                    "raw_data": action # Сохраняем сырые данные для отладки
                }

            event_info["actions"].append(action_details)

        # Добавляем событие только если оно содержит какие-либо распознанные действия
        if event_info["actions"]:
            parsed_transactions.append(event_info)

    # Ограничиваем количество возвращаемых событий до запрошенного лимита
    return parsed_transactions[:limit]