"""
Production-grade guardrail: Ensure tests use SQLite, not production Postgres.
"""
import pytest
from apps.api.tests.conftest import engine


def test_ci_uses_sqlite_database():
    """
    Guardrail test: Verify that CI/test environment uses SQLite.
    This prevents accidental test runs against production Postgres.
    """
    dialect_name = engine.dialect.name
    
    # In CI, we MUST use SQLite
    assert dialect_name == "sqlite", (
        f"❌ Tests must use SQLite in CI, but found: {dialect_name}. "
        "Check DATABASE_URL in your Jenkins/test environment."
    )


def test_database_url_is_set():
    """
    Verify DATABASE_URL is properly configured.
    """
    from apps.api.tests.conftest import DATABASE_URL
    
    assert DATABASE_URL, "DATABASE_URL must be set for tests"
    assert "://" in DATABASE_URL, "DATABASE_URL must be a valid connection string"





