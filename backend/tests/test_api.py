import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Flower Detection AI" in data["service"]

def test_get_flower_list():
    response = client.get("/flower/list")
    assert response.status_code == 200
    flowers = response.json()
    assert len(flowers) == 5
    ids = [f["id"] for f in flowers]
    assert "chrysanthemum" in ids
    assert "rose" in ids
    assert "hydrangea" in ids
    assert "carnation" in ids
    assert "sunflower" in ids

def test_get_flower_detail():
    # Test valid lookup by ID
    response = client.get("/flower/rose")
    assert response.status_code == 200
    data = response.json()
    assert data["name_en"] == "Rose"
    assert data["name_vi"] == "Hoa hồng"

    # Test lookup by index
    response_idx = client.get("/flower/4")
    assert response_idx.status_code == 200
    assert response_idx.json()["id"] == "sunflower"

    # Test 404 for unknown flower
    response_404 = client.get("/flower/non_existent_flower")
    assert response_404.status_code == 404

def test_explain_flower_endpoint():
    # Test Vietnamese explanation
    response_vi = client.post("/flower/explain", json={"flower_name": "rose", "lang": "vi"})
    assert response_vi.status_code == 200
    data_vi = response_vi.json()
    assert "Hoa hồng" in data_vi.get("name_vi", "")
    assert "meaning" in data_vi
    assert "care" in data_vi

    # Test English explanation
    response_en = client.post("/flower/explain", json={"flower_name": "carnation", "lang": "en"})
    assert response_en.status_code == 200
    data_en = response_en.json()
    assert "Carnation" in data_en.get("name_en", "")
    assert "meaning" in data_en

if __name__ == "__main__":
    pytest.main(["-v", __file__])
