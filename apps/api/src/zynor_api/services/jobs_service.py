from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models.job import Job
from ..routers.jobs.schemas import JobCreate, JobUpdate


def list_jobs(db: Session) -> list[Job]:
    return db.query(Job).all()


def get_job(db: Session, job_id: int) -> Job | None:
    return db.get(Job, job_id)


def create_job(db: Session, job_in: JobCreate) -> Job:
    fields = {
        "title": job_in.title.strip(),
        "status": job_in.status,
        "customer_id": job_in.customer_id,
    }
    if job_in.description is not None and job_in.description != "":
        fields["description"] = job_in.description.strip()
    if job_in.scheduled_start_at is not None:
        fields["scheduled_start_at"] = job_in.scheduled_start_at
    if job_in.scheduled_end_at is not None:
        fields["scheduled_end_at"] = job_in.scheduled_end_at
    if job_in.technician_id is not None:
        fields["technician_id"] = job_in.technician_id

    obj = Job(**fields)
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def update_job(db: Session, job_id: int, job_in: JobUpdate) -> Job:
    obj = db.get(Job, job_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Job not found")

    # Update only fields that are provided (exclude unset)
    data = job_in.dict(exclude_unset=True)
    
    if "title" in data and data["title"] is not None:
        obj.title = data["title"].strip()
    if "description" in data:
        obj.description = data["description"].strip() if data["description"] else None
    if "status" in data and data["status"] is not None:
        obj.status = data["status"]
    if "scheduled_start_at" in data:
        obj.scheduled_start_at = data["scheduled_start_at"]
    if "scheduled_end_at" in data:
        obj.scheduled_end_at = data["scheduled_end_at"]
    if "customer_id" in data and data["customer_id"] is not None:
        obj.customer_id = data["customer_id"]
    if "technician_id" in data:
        obj.technician_id = data["technician_id"]

    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_job(db: Session, job_id: int) -> None:
    obj = db.get(Job, job_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(obj)
    db.commit()







