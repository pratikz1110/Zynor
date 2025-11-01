"""
Placeholder for database setup.
Add your engine/session configuration here (e.g., SQLAlchemy).
"""
from __future__ import annotations

import os
from contextlib import contextmanager

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Load local dev env (safe, ignored by git)
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Create apps/api/.env")

# SQLAlchemy 2.0 style engine/session
engine = create_engine(DATABASE_URL, future=True)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)

class Base(DeclarativeBase):
    pass

# FastAPI dependency helper (or use as a context manager anywhere)
@contextmanager
def get_session():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except:  # noqa: E722
        db.rollback()
        raise
    finally:
        db.close()






