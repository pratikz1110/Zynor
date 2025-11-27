from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models.customer import Customer
from ..routers.customers.schemas import CustomerCreate, CustomerUpdate


def list_customers(db: Session) -> list[Customer]:
    return db.query(Customer).all()


def get_customer(db: Session, customer_id: int) -> Customer | None:
    return db.get(Customer, customer_id)


def create_customer(db: Session, customer_in: CustomerCreate) -> Customer:
    fields = {
        "name": customer_in.name.strip(),
    }
    if customer_in.phone is not None and customer_in.phone != "":
        fields["phone"] = customer_in.phone.strip()
    if customer_in.email is not None:
        fields["email"] = str(customer_in.email).lower()
    if customer_in.address is not None and customer_in.address != "":
        fields["address"] = customer_in.address.strip()

    obj = Customer(**fields)
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def update_customer(db: Session, customer_id: int, customer_in: CustomerUpdate) -> Customer:
    obj = db.get(Customer, customer_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Update only fields that are provided (exclude unset)
    update_data = customer_in.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] is not None:
        obj.name = update_data["name"].strip()
    if "phone" in update_data:
        obj.phone = update_data["phone"].strip() if update_data["phone"] else None
    if "email" in update_data:
        obj.email = str(update_data["email"]).lower() if update_data["email"] else None
    if "address" in update_data:
        obj.address = update_data["address"].strip() if update_data["address"] else None

    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_customer(db: Session, customer_id: int) -> None:
    obj = db.get(Customer, customer_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(obj)
    db.commit()












