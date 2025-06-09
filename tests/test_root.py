import asyncio
from httpx import AsyncClient, ASGITransport
from api.main import app


def test_read_root():
    async def _run():
        async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
            return await client.get("/")

    resp = asyncio.run(_run())
    assert resp.status_code == 200
    assert resp.json() == {"message": "Welcome to JetRadar API"}
