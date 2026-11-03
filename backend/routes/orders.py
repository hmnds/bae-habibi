import secrets
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import MenuItem, Order, OrderItem, OrderStatus, OrderType
from schemas import OrderCreate, OrderList, OrderRead, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])

TWO_PLACES = Decimal("0.01")

# Allowed status transitions for the kitchen workflow.
ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY, OrderStatus.CANCELLED},
    OrderStatus.READY: {OrderStatus.COMPLETED, OrderStatus.CANCELLED},
    OrderStatus.COMPLETED: set(),
    OrderStatus.CANCELLED: set(),
}


def generate_order_number(db: Session) -> str:
    for _ in range(10):
        candidate = f"BHW-{secrets.token_hex(4).upper()}"
        if db.scalar(select(Order.id).where(Order.order_number == candidate)) is None:
            return candidate
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate order number"
    )


def get_order_or_404(db: Session, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    # Merge duplicate lines for the same menu item + instructions.
    merged: dict[tuple[int, str | None], int] = {}
    for line in payload.items:
        instructions = (line.special_instructions or "").strip() or None
        key = (line.menu_item_id, instructions)
        merged[key] = merged.get(key, 0) + line.quantity

    item_ids = {menu_item_id for menu_item_id, _ in merged}
    menu_items = {
        item.id: item for item in db.scalars(select(MenuItem).where(MenuItem.id.in_(item_ids))).all()
    }

    missing = sorted(item_ids - menu_items.keys())
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Menu items not found: {missing}"
        )
    unavailable = [item.name for item in menu_items.values() if not item.is_available]
    if unavailable:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Currently unavailable: {', '.join(sorted(unavailable))}",
        )

    order_items: list[OrderItem] = []
    subtotal = Decimal("0.00")
    for (menu_item_id, instructions), quantity in merged.items():
        if quantity > 50:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Maximum quantity per item is 50",
            )
        menu_item = menu_items[menu_item_id]
        # Prices always come from the database, never from the client.
        subtotal += (menu_item.price * quantity).quantize(TWO_PLACES)
        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                item_name=menu_item.name,
                unit_price=menu_item.price,
                quantity=quantity,
                special_instructions=instructions,
            )
        )

    delivery_fee = (
        settings.delivery_fee.quantize(TWO_PLACES)
        if payload.order_type == OrderType.DELIVERY
        else Decimal("0.00")
    )

    order = Order(
        order_number=generate_order_number(db),
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        order_type=payload.order_type,
        delivery_address=payload.delivery_address,
        notes=payload.notes,
        payment_method=payload.payment_method,
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=subtotal + delivery_fee,
        items=order_items,
    )
    db.add(order)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Could not place order, please retry"
        ) from exc
    db.refresh(order)
    return order


@router.get("", response_model=OrderList)
def list_orders(
    status_filter: OrderStatus | None = Query(None, alias="status"),
    order_type: OrderType | None = None,
    phone: str | None = Query(None, min_length=3, max_length=30),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> OrderList:
    query = select(Order)
    count_query = select(func.count(Order.id))
    if status_filter is not None:
        query = query.where(Order.status == status_filter)
        count_query = count_query.where(Order.status == status_filter)
    if order_type is not None:
        query = query.where(Order.order_type == order_type)
        count_query = count_query.where(Order.order_type == order_type)
    if phone:
        query = query.where(Order.customer_phone == phone.strip())
        count_query = count_query.where(Order.customer_phone == phone.strip())

    total = db.scalar(count_query) or 0
    orders = db.scalars(query.order_by(Order.created_at.desc(), Order.id.desc()).offset(skip).limit(limit)).all()
    return OrderList(total=total, items=[OrderRead.model_validate(order) for order in orders])


@router.get("/number/{order_number}", response_model=OrderRead)
def get_order_by_number(order_number: str, db: Session = Depends(get_db)) -> Order:
    order = db.scalar(select(Order).where(Order.order_number == order_number.strip().upper()))
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    return get_order_or_404(db, order_id)


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)) -> Order:
    order = get_order_or_404(db, order_id)
    if payload.status == order.status:
        return order
    if payload.status not in ALLOWED_TRANSITIONS[order.status]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot change status from '{order.status.value}' to '{payload.status.value}'",
        )
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/cancel", response_model=OrderRead)
def cancel_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = get_order_or_404(db, order_id)
    if order.status == OrderStatus.CANCELLED:
        return order
    if OrderStatus.CANCELLED not in ALLOWED_TRANSITIONS[order.status]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel an order that is '{order.status.value}'",
        )
    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> Response:
    order = get_order_or_404(db, order_id)
    db.delete(order)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

