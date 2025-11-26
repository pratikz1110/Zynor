from uuid import UUID
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ...db import get_session
from ...security.auth import get_current_user, require_roles
from ...models.user import User
from ...services.technicians_service import (
    create_technician as svc_create,
    get_technician as svc_get,
    list_technicians_db as svc_list_db,
    update_technician as svc_update,
    patch_technician as svc_patch,
    delete_technician as svc_delete,
)
from .schemas import TechnicianCreate, TechnicianUpdate, TechnicianPatch, TechnicianOut, PaginatedTechnicians

router = APIRouter(prefix="/technicians", tags=["Technicians"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TechnicianOut,
    responses={
        409: {"description": "Email already in use"},
        422: {"description": "Validation error"},
    }
)
async def create_technician(
    payload: TechnicianCreate,
    db: Session = Depends(get_session),
):
    try:
        obj = svc_create(db, payload, None)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Email or phone already exists")
    return obj


@router.get(
    "",
    response_model=PaginatedTechnicians,
    responses={
        422: {"description": "Validation error"},
    }
)
def list_techs(
    page: int = 1,
    page_size: int = 25,
    q: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    email: Optional[str] = None,
    is_active: Optional[bool] = None,
    skill: Optional[str] = None,
    min_rate: Optional[float] = None,
    max_rate: Optional[float] = None,
    sort: Optional[List[str]] = Query(default=None, description="Fields like first_name,-email,created_at"),
    db: Session = Depends(get_session),
):
    return svc_list_db(
        db=db,
        page=page,
        page_size=page_size,
        q=q,
        first_name=first_name,
        last_name=last_name,
        email=email,
        is_active=is_active,
        skill=skill,
        min_rate=min_rate,
        max_rate=max_rate,
        sort=sort,
    )


@router.get(
    "/{tech_id}",
    response_model=TechnicianOut,
    responses={
        404: {"description": "Technician not found"},
        422: {"description": "Validation error"},
    }
)
async def get_technician(tech_id: UUID, db: Session = Depends(get_session)):
    obj = svc_get(db, tech_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Technician not found")
    return obj


@router.put(
    "/{tech_id}",
    response_model=TechnicianOut,
    responses={
        404: {"description": "Technician not found"},
        409: {"description": "Email already in use"},
        422: {"description": "Validation error"},
    }
)
async def update_technician(
    tech_id: UUID,
    payload: TechnicianUpdate,
    db: Session = Depends(get_session),
):
    return svc_update(db, tech_id, payload, None)


@router.patch(
    "/{tech_id}",
    status_code=status.HTTP_200_OK,
    response_model=TechnicianOut,
    responses={
        404: {"description": "Technician not found"},
        409: {"description": "Email already in use"},
        422: {"description": "Validation error"},
    }
)
async def partial_update_technician(
    tech_id: str,
    payload: TechnicianPatch,
    db: Session = Depends(get_session),
    current_user: User = Depends(require_roles("admin"))
):
    """
    Partially update a technician.
    """
    updated = svc_patch(db=db, tech_id=tech_id, payload=payload, user_id=current_user.id)
    return updated


@router.delete(
    "/{tech_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"description": "Technician not found"},
    }
)
async def delete_technician(tech_id: UUID, db: Session = Depends(get_session)) -> None:
    svc_delete(db, tech_id)

