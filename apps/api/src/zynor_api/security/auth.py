import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from jose import jwt
from passlib.context import CryptContext


# ---- Settings from environment ----
SECRET_KEY = os.getenv("JWT_SECRET", "dev-only")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


# ---- Password hashing (bcrypt via passlib) ----
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---- JWT creation ----
def create_access_token(data: Dict[str, Any], expires_minutes: int = ACCESS_MIN) -> str:
    """
    Encodes a JWT with `sub` and any extra claims in `data`.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode token, fetch active user, or raise 401."""
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    from jose import jwt, JWTError  # local import to avoid circulars
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise cred_exc
    except JWTError:
        raise cred_exc

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise cred_exc
    return user


def require_roles(*roles: str):
    """Dependency to enforce role-based access."""
    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return user
    return _dep

