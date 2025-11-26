import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ..db import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    # Core job fields
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="NEW")

    # Scheduling
    scheduled_start_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_end_at = Column(DateTime(timezone=True), nullable=True)

    # Relations to other entities
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    technician_id = Column(
        UUID(as_uuid=True),
        ForeignKey("technicians.id"),
        nullable=True,
    )

    # Audit fields
    created_by_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Optional relationships (string class names avoid import cycles)
    created_by = relationship("User", foreign_keys=[created_by_user_id], lazy="joined")
    updated_by = relationship("User", foreign_keys=[updated_by_user_id], lazy="joined")

    def __repr__(self):
        return f"<Job id={self.id} title={self.title}>"




