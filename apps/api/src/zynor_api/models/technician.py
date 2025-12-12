import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ..db import Base


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    skills = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Optional relationships (string class names avoid import cycles)
    created_by = relationship("User", foreign_keys=[created_by_user_id], lazy="joined")
    updated_by = relationship("User", foreign_keys=[updated_by_user_id], lazy="joined")

    def __repr__(self):
        return f"<Technician id={self.id} email={self.email}>"
