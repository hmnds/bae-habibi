from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from models import OrderStatus, OrderType, PaymentMethod


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------- Categories
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    display_order: int = Field(0, ge=0)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    display_order: int | None = Field(None, ge=0)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value


class CategoryRead(ORMModel, CategoryBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------- Menu items
class MenuItemBase(BaseModel):
    category_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    price: Decimal = Field(..., ge=0, max_digits=10, decimal_places=2)
    image_url: str | None = Field(None, max_length=500)
    is_available: bool = True
    is_featured: bool = False
    is_vegetarian: bool = False
    is_spicy: bool = False
    display_order: int = Field(0, ge=0)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    category_id: int | None = Field(None, gt=0)
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    price: Decimal | None = Field(None, ge=0, max_digits=10, decimal_places=2)
    image_url: str | None = Field(None, max_length=500)
    is_available: bool | None = None
    is_featured: bool | None = None
    is_vegetarian: bool | None = None
    is_spicy: bool | None = None
    display_order: int | None = Field(None, ge=0)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value


class MenuItemRead(ORMModel, MenuItemBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime


class CategoryWithItems(CategoryRead):
    items: list[MenuItemRead] = []


# -------------------------------------------------------------------- Orders
class OrderItemCreate(BaseModel):
    menu_item_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, le=50)
    special_instructions: str | None = Field(None, max_length=500)


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=150)
    customer_phone: str = Field(..., min_length=5, max_length=30)
    customer_email: EmailStr | None = None
    order_type: OrderType = OrderType.COLLECTION
    delivery_address: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=1000)
    payment_method: PaymentMethod = PaymentMethod.CASH
    items: list[OrderItemCreate] = Field(..., min_length=1, max_length=50)

    @field_validator("customer_name", "customer_phone")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value must not be blank")
        return value

    @field_validator("delivery_address", "notes")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def validate_delivery(self) -> "OrderCreate":
        if self.order_type == OrderType.DELIVERY and not self.delivery_address:
            raise ValueError("delivery_address is required for delivery orders")
        if self.order_type == OrderType.COLLECTION:
            self.delivery_address = None
        return self


class OrderItemRead(ORMModel):
    id: int
    menu_item_id: int | None
    item_name: str
    unit_price: Decimal
    quantity: int
    special_instructions: str | None
    line_total: Decimal


class OrderRead(ORMModel):
    id: int
    order_number: str
    customer_name: str
    customer_phone: str
    customer_email: str | None
    order_type: OrderType
    delivery_address: str | None
    notes: str | None
    payment_method: PaymentMethod
    status: OrderStatus
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderList(BaseModel):
    total: int
    items: list[OrderRead]

