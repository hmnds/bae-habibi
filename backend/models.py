import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderType(str, enum.Enum):
    COLLECTION = "collection"
    DELIVERY = "delivery"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    items: Mapped[list["MenuItem"]] = relationship(
        "MenuItem",
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="MenuItem.display_order",
    )


class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_menu_items_price_non_negative"),
        Index("ix_menu_items_category_available", "category_id", "is_available"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(170), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_vegetarian: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_spicy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    category: Mapped["Category"] = relationship("Category", back_populates="items")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="menu_item")


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="ck_orders_subtotal_non_negative"),
        CheckConstraint("total >= 0", name="ck_orders_total_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_type: Mapped[OrderType] = mapped_column(
        Enum(OrderType, name="order_type", values_callable=lambda e: [m.value for m in e]),
        default=OrderType.COLLECTION,
        nullable=False,
    )
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method", values_callable=lambda e: [m.value for m in e]),
        default=PaymentMethod.CASH,
        nullable=False,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status", values_callable=lambda e: [m.value for m in e]),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True,
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="ck_order_items_price_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("menu_items.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Snapshot of item name/price at purchase time so history survives menu edits.
    item_name: Mapped[str] = mapped_column(String(150), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    special_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    menu_item: Mapped["MenuItem | None"] = relationship("MenuItem", back_populates="order_items")

    @property
    def line_total(self) -> Decimal:
        return (self.unit_price * self.quantity).quantize(Decimal("0.01"))

