import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TONAPI_KEY = os.getenv("TONAPI_KEY")
TONAPI_BASE_URL = "https://tonapi.io/v2"


async def fetch_transactions(address: str, limit: int = 10):
    """
    Функція-заглушка, яка робить HTTP-запит до TonAPI, повертає JSON-список
    транзакцій. Використовується як альтернатива прямому виклику з FastAPI.
    Виклик:
        data = await fetch_transactions("адреса", limit=5)
    """
    if not TONAPI_KEY:
        raise RuntimeError("TONAPI_KEY не задано у .env")

    url = f"{TONAPI_BASE_URL}/blockchain/accounts/{address}/transactions?limit={limit}"
    headers = {"Authorization": f"Bearer {TONAPI_KEY}"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, timeout=10.0)
        resp.raise_for_status()
        return resp.json().get("transactions", [])
