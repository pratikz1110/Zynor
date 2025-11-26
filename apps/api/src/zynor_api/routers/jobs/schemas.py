from datetime import datetime

from typing import Optional
from pydantic import BaseModel


class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "NEW"
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    customer_id: int
    technician_id: Optional[int] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    customer_id: Optional[int] = None
    technician_id: Optional[int] = None


class Job(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        orm_mode = True







