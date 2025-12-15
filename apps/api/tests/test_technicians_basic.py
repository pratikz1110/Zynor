import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_list_technicians_returns_200_and_items_list(client: TestClient):
    """
    Smoke test for technicians list endpoint:
    - Calls the endpoint
    - Expects 200 OK
    - Expects the response body to contain an 'items' list and pagination metadata
    """
    response = client.get("/api/technicians")
    assert response.status_code == 200

    data = response.json()

    # Response should be a dict with pagination fields
    assert isinstance(data, dict)
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data

    # items should be a list (empty or not)
    assert isinstance(data["items"], list)
