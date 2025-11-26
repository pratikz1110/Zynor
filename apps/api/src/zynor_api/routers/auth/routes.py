from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session
from ...security.auth import (
    verify_password,
    create_access_token,
    get_current_user,
    get_db,
)
from ...models.user import User
from .schemas import LoginRequest, Token, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.username).first()
    if not user or not user.is_active or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
def me(current=Depends(get_current_user)):
    return {"id": current.id, "email": current.email, "role": current.role}



