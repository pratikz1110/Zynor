from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import re

_PHONE_RE = re.compile(r"^\+?[0-9\-()\s]{7,20}$")


class TechnicianBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None)
    skills: Optional[List[str]] = Field(default=None, description="Up to 20 skills; each 1–50 chars")
    is_active: bool = True

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v):
        if v is None or v == "":
            return None
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone format")
        return v

    @field_validator("skills")
    @classmethod
    def _validate_skills(cls, v):
        if v is None:
            return v
        if len(v) > 20:
            raise ValueError("At most 20 skills allowed")
        # strip + dedupe while preserving order
        seen, cleaned = set(), []
        for s in v:
            s = s.strip()
            if not (1 <= len(s) <= 50):
                raise ValueError("Each skill must be 1–50 chars")
            if s.lower() not in seen:
                seen.add(s.lower())
                cleaned.append(s)
        return cleaned


class TechnicianCreate(TechnicianBase):
    pass


class TechnicianUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v):
        if v is None or v == "":
            return None
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone format")
        return v

    @field_validator("skills")
    @classmethod
    def _validate_skills(cls, v):
        if v is None:
            return v
        if len(v) > 20:
            raise ValueError("At most 20 skills allowed")
        seen, cleaned = set(), []
        for s in v:
            s = s.strip()
            if not (1 <= len(s) <= 50):
                raise ValueError("Each skill must be 1–50 chars")
            if s.lower() not in seen:
                seen.add(s.lower())
                cleaned.append(s)
        return cleaned


class TechnicianOut(TechnicianBase):
    id: UUID
    created_by_user_id: Optional[int] = None
    updated_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# PATCH payload: all fields optional, only provided ones will be updated
class TechnicianPatch(BaseModel):
    # Reject unknown/extra keys
    model_config = ConfigDict(extra="forbid")

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def _strip_and_validate_names(cls, v):
        if v is None:
            return v
        v = str(v).strip()
        if not v:
            raise ValueError("Must not be empty")
        if len(v) > 80:
            raise ValueError("Must be ≤ 80 characters")
        return v

    @field_validator("phone", mode="before")
    @classmethod
    def _normalize_phone(cls, v):
        if v is None:
            return v
        v = str(v).strip()
        if len(v) > 25:
            raise ValueError("Phone too long")
        return v

    @field_validator("skills")
    @classmethod
    def _validate_skills(cls, v):
        if v is None:
            return v
        cleaned = []
        for s in v:
            s = str(s).strip()
            if not s:
                continue
            if len(s) > 40:
                raise ValueError("Each skill must be ≤ 40 chars")
            cleaned.append(s)
        # de-duplicate while preserving order
        seen = set()
        deduped = []
        for s in cleaned:
            if s not in seen:
                seen.add(s)
                deduped.append(s)
        return deduped

    @field_validator("hourly_rate")
    @classmethod
    def _validate_rate(cls, v):
        if v is None:
            return v
        v = float(v)
        if v < 0:
            raise ValueError("hourly_rate must be ≥ 0")
        return v


class PaginatedTechnicians(BaseModel):
    items: List[TechnicianOut]
    page: int
    page_size: int
    total: int

