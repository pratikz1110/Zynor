import os
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models.user import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_admin():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        print("Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env")
        return

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print("Admin already exists:", email)
            return
        hashed_pw = pwd_context.hash(password)
        admin_user = User(email=email, hashed_password=hashed_pw, role="admin", is_active=True)
        db.add(admin_user)
        db.commit()
        print("Seeded admin:", email)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()




