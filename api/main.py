from fastapi import FastAPI
from .routes.wallets import router as wallets_router

app = FastAPI(
    title="JetRadar API",
    description="API для JetRadar (отримання історії гаманців тощо)",
    version="0.1.0",
)

# Оце ЄДИНЕ ПРАВИЛЬНЕ включення:
app.include_router(wallets_router, prefix="/wallet", tags=["Wallet"])