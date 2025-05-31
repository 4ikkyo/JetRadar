from fastapi import FastAPI
from .routes.wallets import router as wallets_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="JetRadar API",
    description="API для JetRadar (отримання історії гаманців тощо)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # или ограничь на нужный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Оце ЄДИНЕ ПРАВИЛЬНЕ включення:
app.include_router(wallets_router, prefix="/wallet", tags=["Wallet"])