"""
Placeholder for database setup.
Add your engine/session configuration here (e.g., SQLAlchemy).
"""
from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from .settings import DATABASE_URL



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

# FastAPI dependency helper
def get_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()






