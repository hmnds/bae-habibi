import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Category, MenuItem
from schemas import (
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    CategoryWithItems,
    MenuItemCreate,
    MenuItemRead,
    MenuItemUpdate,
)

router = APIRouter(prefix="/menu", tags=["Menu"])


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return slug or "item"


def unique_slug(db: Session, model: type[Category] | type[MenuItem], base: str, exclude_id: int | None = None) -> str:
    slug = slugify(base)
    candidate = slug
    counter = 2
    while True:
        query = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            query = query.where(model.id != exclude_id)
        if db.execute(query).first() is None:
            return candidate
        candidate = f"{slug}-{counter}"
        counter += 1


def get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def get_item_or_404(db: Session, item_id: int) -> MenuItem:
    item = db.get(MenuItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item


# ---------------------------------------------------------------- Categories
@router.get("/categories", response_model=list[CategoryRead])
def list_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
) -> list[Category]:
    query = select(Category).order_by(Category.display_order, Category.name)
    if not include_inactive:
        query = query.where(Category.is_active.is_(True))
    return list(db.scalars(query).all())


@router.get("/full", response_model=list[CategoryWithItems])
def get_full_menu(db: Session = Depends(get_db)) -> list[CategoryWithItems]:
    """Active categories, each with its available items. Used by the storefront."""
    categories = db.scalars(
        select(Category)
        .where(Category.is_active.is_(True))
        .options(selectinload(Category.items))
        .order_by(Category.display_order, Category.name)
    ).all()
    result: list[CategoryWithItems] = []
    for category in categories:
        data = CategoryWithItems.model_validate(category)
        data.items = [
            MenuItemRead.model_validate(item) for item in category.items if item.is_available
        ]
        result.append(data)
    return result


@router.get("/categories/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)) -> Category:
    return get_category_or_404(db, category_id)


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    if db.scalar(select(Category.id).where(Category.name == payload.name)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")
    category = Category(**payload.model_dump(), slug=unique_slug(db, Category, payload.name))
    db.add(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists") from exc
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)) -> Category:
    category = get_category_or_404(db, category_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("name") is None:
        data.pop("name", None)
    if "display_order" in data and data["display_order"] is None:
        data.pop("display_order")
    if "is_active" in data and data["is_active"] is None:
        data.pop("is_active")

    new_name = data.get("name")
    if new_name and new_name != category.name:
        clash = db.scalar(select(Category.id).where(Category.name == new_name, Category.id != category.id))
        if clash is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")
        category.slug = unique_slug(db, Category, new_name, exclude_id=category.id)

    for field, value in data.items():
        setattr(category, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists") from exc
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)) -> Response:
    category = get_category_or_404(db, category_id)
    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------- Menu items
@router.get("/items", response_model=list[MenuItemRead])
def list_items(
    category_id: int | None = None,
    category_slug: str | None = None,
    featured: bool | None = None,
    vegetarian: bool | None = None,
    spicy: bool | None = None,
    search: str | None = Query(None, min_length=1, max_length=100),
    include_unavailable: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[MenuItem]:
    query = select(MenuItem)
    if category_id is not None:
        query = query.where(MenuItem.category_id == category_id)
    if category_slug:
        query = query.join(Category).where(Category.slug == category_slug)
    if featured is not None:
        query = query.where(MenuItem.is_featured.is_(featured))
    if vegetarian is not None:
        query = query.where(MenuItem.is_vegetarian.is_(vegetarian))
    if spicy is not None:
        query = query.where(MenuItem.is_spicy.is_(spicy))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(MenuItem.name.ilike(pattern) | MenuItem.description.ilike(pattern))
    if not include_unavailable:
        query = query.where(MenuItem.is_available.is_(True))
    query = query.order_by(MenuItem.display_order, MenuItem.name).offset(skip).limit(limit)
    return list(db.scalars(query).all())


@router.get("/items/{item_id}", response_model=MenuItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)) -> MenuItem:
    return get_item_or_404(db, item_id)


@router.post("/items", response_model=MenuItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: MenuItemCreate, db: Session = Depends(get_db)) -> MenuItem:
    get_category_or_404(db, payload.category_id)
    item = MenuItem(**payload.model_dump(), slug=unique_slug(db, MenuItem, payload.name))
    db.add(item)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Menu item conflict") from exc
    db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=MenuItemRead)
def update_item(item_id: int, payload: MenuItemUpdate, db: Session = Depends(get_db)) -> MenuItem:
    item = get_item_or_404(db, item_id)
    data = payload.model_dump(exclude_unset=True)
    # Non-nullable columns: ignore explicit nulls instead of failing at the database.
    for field in (
        "category_id",
        "name",
        "price",
        "is_available",
        "is_featured",
        "is_vegetarian",
        "is_spicy",
        "display_order",
    ):
        if field in data and data[field] is None:
            data.pop(field)

    if "category_id" in data:
        get_category_or_404(db, data["category_id"])
    if "name" in data and data["name"] != item.name:
        item.slug = unique_slug(db, MenuItem, data["name"], exclude_id=item.id)

    for field, value in data.items():
        setattr(item, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Menu item conflict") from exc
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)) -> Response:
    item = get_item_or_404(db, item_id)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

