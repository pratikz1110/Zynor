from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from ...db import get_session
from ...services.jobs_service import (
    create_job as svc_create,
    get_job as svc_get,
    list_jobs as svc_list,
    update_job as svc_update,
    delete_job as svc_delete,
)
from .schemas import Job, JobCreate, JobUpdate

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)


@router.get("/", response_model=List[Job])
def list_jobs(db: Session = Depends(get_session)):
    return svc_list(db)


@router.get("/{job_id}", response_model=Job)
def get_job(job_id: int, db: Session = Depends(get_session)):
    job = svc_get(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/", response_model=Job, status_code=status.HTTP_201_CREATED)
def create_job(job_in: JobCreate, db: Session = Depends(get_session)):
    try:
        return svc_create(db, job_in)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Invalid foreign key reference")


@router.put("/{job_id}", response_model=Job)
def update_job(job_id: int, job_in: JobUpdate, db: Session = Depends(get_session)):
    return svc_update(db, job_id, job_in)


@router.patch("/{job_id}", response_model=Job)
def partial_update_job(job_id: int, job_in: JobUpdate, db: Session = Depends(get_session)):
    return svc_update(db, job_id, job_in)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_session)) -> None:
    svc_delete(db, job_id)

