from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_read_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Welcome to JetRadar API"}

