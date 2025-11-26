from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ...db import get_session
from ...services.customers_service import (
    create_customer as svc_create,
    get_customer as svc_get,
    list_customers as svc_list,
    update_customer as svc_update,
    delete_customer as svc_delete,
)
from .schemas import Customer, CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Customer,
    responses={
        409: {"description": "Email already in use"},
        422: {"description": "Validation error"},
    }
)
async def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_session),
):
    try:
        obj = svc_create(db, customer_data)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Email or phone already exists")
    return obj


@router.get(
    "",
    response_model=list[Customer],
    responses={
        422: {"description": "Validation error"},
    }
)
def list_customers(db: Session = Depends(get_session)):
    return svc_list(db)


@router.get(
    "/{customer_id}",
    response_model=Customer,
    responses={
        404: {"description": "Customer not found"},
        422: {"description": "Validation error"},
    }
)
async def get_customer(customer_id: int, db: Session = Depends(get_session)):
    obj = svc_get(db, customer_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")
    return obj


@router.put(
    "/{customer_id}",
    response_model=Customer,
    responses={
        404: {"description": "Customer not found"},
        409: {"description": "Email already in use"},
        422: {"description": "Validation error"},
    }
)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_session),
):
    return svc_update(db, customer_id, customer_data)


@router.patch(
    "/{customer_id}",
    status_code=status.HTTP_200_OK,
    response_model=Customer,
    responses={
        404: {"description": "Customer not found"},
        409: {"description": "Email already in use"},
        422: {"description": "Validation error"},
    }
)
async def partial_update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_session),
):
    return svc_update(db, customer_id, customer_data)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"description": "Customer not found"},
    }
)
async def delete_customer(customer_id: int, db: Session = Depends(get_session)) -> None:
    svc_delete(db, customer_id)

