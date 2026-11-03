import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

import models  # noqa: F401  (registers tables on Base.metadata)
from config import settings
from database import Base, engine, get_db
from routes import menu_router, orders_router

logger = logging.getLogger("bae_habibi_wrap")
logging.basicConfig(level=logging.DEBUG if settings.debug else logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.app_name)
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    description="Backend API for Bae Habibi Wrap - Middle Eastern street food takeaway.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(menu_router)
app.include_router(orders_router)


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {"name": settings.app_name, "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["Root"])
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.exception("Database health check failed")
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.debug)

