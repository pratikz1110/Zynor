from __future__ import annotations

import os, sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context

# Import your Base for autogenerate
from apps.api.src.zynor_api.db import Base
from apps.api.src.zynor_api import models  # noqa: F401

from apps.api.src.zynor_api.settings import get_settings
settings = get_settings()

# this is the Alembic Config object, which provides access to values within the .ini file.
config = context.config

# Prefer env var, then try both attribute casings on the settings object
db_url = (
    os.getenv("DATABASE_URL")
    or getattr(settings, "DATABASE_URL", None)
    or getattr(settings, "database_url", None)
)
if db_url:
    context.config.set_main_option("sqlalchemy.url", db_url)
else:
    raise RuntimeError("DATABASE_URL not found for Alembic (env var or settings).")

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_database_url() -> str:
    url = (
        os.getenv("DATABASE_URL")
        or getattr(settings, "DATABASE_URL", None)
        or getattr(settings, "database_url", None)
    )
    if not url:
        raise RuntimeError("DATABASE_URL not found for Alembic (env var or settings).")
    return url

def run_migrations_offline() -> None:
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    url = get_database_url()
    connectable = create_engine(url, poolclass=pool.NullPool, future=True)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
