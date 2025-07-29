# JetRadar

**JetRadar** is a Telegram bot, FastAPI service, and React web app for monitoring activity of TON wallets. It consists of three main parts:

1. **FastAPI Service (`api/`)**
   – Provides endpoints to fetch transaction history via TonAPI and generate wallet connection graphs.

2. **Telegram Bot (`bot/`)**
   – Supports commands like `/start`, `/add`, `/list`, `/tx`.
   – Uses the FastAPI backend for all data operations.

3. **React Frontend (`docs/`)**
   – A mini app for Telegram built with React.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd JetRadar
```

### 2. Configure environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
# Edit .env and provide your values (BOT_TOKEN, TONAPI_KEY, BACKEND_URL, etc.)
```

### 3. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the FastAPI server

```bash
uvicorn api.main:app --reload
```

### 6. Run the Telegram bot (in another terminal)

```bash
python bot/main.py
```

## Frontend

Install Node.js dependencies and run the React frontend located in `docs`:

```bash
cd docs
npm install
```

Start the development server with:

```bash
npm run dev
```

Or build the production bundle:

```bash
npm run build
```

The compiled site will be placed in `docs/dist`.

---

## ⚙Environment Variables

The following environment variables must be set in your `.env` file:

- `BOT_TOKEN` – Your Telegram bot token.
- `TONAPI_KEY` – API key for accessing TonAPI.
- `BACKEND_URL` – (Optional) Full URL to your FastAPI backend if running separately.

---

## Testing

Install the project requirements and `pytest`:

```bash
pip install -r requirements.txt
pip install pytest
```

Run the tests with:

```bash
pytest
```

The tests run with the default settings, so no environment variables are required.

---

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
