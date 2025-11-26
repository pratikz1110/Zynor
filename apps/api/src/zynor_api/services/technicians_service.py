from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_, asc, desc, String
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models.technician import Technician
from ..routers.technicians.schemas import TechnicianCreate, TechnicianUpdate, TechnicianPatch


def create_technician(db: Session, data: TechnicianCreate, user_id: int) -> Technician:
    fields = {
        "first_name": data.first_name.strip(),
        "last_name": data.last_name.strip(),
        "email": str(data.email).lower(),
        "is_active": data.is_active,
        "created_by_user_id": user_id,
        "updated_by_user_id": user_id,
    }
    if data.phone is not None and data.phone != "":
        fields["phone"] = data.phone
    if data.skills is not None:
        fields["skills"] = data.skills

    obj = Technician(**fields)
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def get_technician(db: Session, tech_id: UUID) -> Technician | None:
    return db.get(Technician, tech_id)


def list_technicians_db(
    db: Session,
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
    sort: Optional[List[str]] = None,
):
    qry = db.query(Technician)
    if q:
        like = f"%{q.strip()}%"
        qry = qry.filter(or_(
            Technician.first_name.ilike(like),
            Technician.last_name.ilike(like),
            Technician.email.ilike(like),
            Technician.phone.ilike(like),
        ))
    if first_name:
        qry = qry.filter(Technician.first_name.ilike(f"%{first_name.strip()}%"))
    if last_name:
        qry = qry.filter(Technician.last_name.ilike(f"%{last_name.strip()}%"))
    if email:
        qry = qry.filter(Technician.email.ilike(f"%{email.strip()}%"))
    if is_active is not None:
        qry = qry.filter(Technician.is_active == is_active)
    if skill:
        try:
            qry = qry.filter(Technician.skills.contains([skill]))
        except Exception:
            like = f"%{skill.strip()}%"
            qry = qry.filter(Technician.skills.cast(String).ilike(like))
    if min_rate is not None:
        qry = qry.filter(Technician.hourly_rate >= float(min_rate))
    if max_rate is not None:
        qry = qry.filter(Technician.hourly_rate <= float(max_rate))
    if sort:
        order_clauses = []
        for field in sort:
            direction = asc
            name = field
            if field.startswith("-"):
                direction = desc
                name = field[1:]
            if hasattr(Technician, name):
                order_clauses.append(direction(getattr(Technician, name)))
        if order_clauses:
            qry = qry.order_by(*order_clauses)
    else:
        qry = qry.order_by(asc(Technician.first_name), asc(Technician.last_name))
    total = qry.count()
    offset = max(0, (page - 1) * page_size)
    rows = qry.offset(offset).limit(page_size).all()
    return {
        "items": rows,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def update_technician(db: Session, tech_id: UUID, payload: TechnicianUpdate, user_id: int) -> Technician:
    obj = db.get(Technician, tech_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Technician not found")

    if payload.email and payload.email != obj.email:
        exists = (
            db.query(Technician)
            .filter(Technician.email == payload.email, Technician.id != tech_id)
            .first()
        )
        if exists:
            raise HTTPException(status_code=409, detail="Email already in use")
        obj.email = payload.email

    if payload.phone and payload.phone != obj.phone:
        exists = (
            db.query(Technician)
            .filter(Technician.phone == payload.phone, Technician.id != tech_id)
            .first()
        )
        if exists:
            raise HTTPException(status_code=409, detail="Email already in use")
        obj.phone = payload.phone

    obj.first_name = payload.first_name
    obj.last_name = payload.last_name
    obj.skills = payload.skills or []
    obj.is_active = payload.is_active
    obj.updated_by_user_id = user_id

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


PATCHABLE_FIELDS = {
    "first_name",
    "last_name",
    "email",
    "phone",
    "is_active",
    "skills",
    "hourly_rate",
}

def patch_technician(db, tech_id: str, payload: TechnicianPatch, user_id: int):
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=422, detail="No valid fields to update")

    invalid = set(data.keys()) - PATCHABLE_FIELDS
    if invalid:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported field(s): {', '.join(sorted(invalid))}"
        )

    for field, value in data.items():
        setattr(tech, field, value)

    tech.updated_at = datetime.now(timezone.utc)
    tech.updated_by_user_id = user_id

    try:
        db.add(tech)
        db.commit()
        db.refresh(tech)
    except IntegrityError as e:
        db.rollback()
        if "email" in str(e).lower():
            raise HTTPException(status_code=409, detail="Email already in use")
        raise HTTPException(status_code=400, detail="Email already in use")

    return tech


def delete_technician(db: Session, tech_id: UUID) -> None:
    obj = db.get(Technician, tech_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Technician not found")

    db.delete(obj)
    db.commit()
