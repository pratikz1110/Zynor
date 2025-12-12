import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ------------------------------------------------------------------
# Ensure the project root (ZYNOR/) is on PYTHONPATH
# ------------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import app + DB base / dependency
from apps.api.src.zynor_api.main import app
from apps.api.src.zynor_api.db import Base, get_session
from apps.api.src.zynor_api.settings import get_settings


# ------------------------------------------------------------------
# Test database setup (Postgres, same as dev for now)
# ------------------------------------------------------------------
DATABASE_URL = get_settings().database_url

engine = create_engine(
    DATABASE_URL,
    future=True,
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def override_get_session():
    """Dependency override for FastAPI: use the test DB session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Ensure all tables exist in the test database once per test session.
    Safe to call even if migrations already created them.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # optional: don't drop tables so you can inspect DB after tests
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """
    Provides a TestClient that uses the Postgres test DB via dependency override.
    """
    app.dependency_overrides[get_session] = override_get_session
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
