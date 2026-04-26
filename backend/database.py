"""
database.py
-----------
SQLAlchemy engine + session factory for Dspire VR Zone.
The database file lives at /home/data/dspirezone.db on the Azure host.
"""
import os
import re
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:////home/data/dspirezone.db"
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER_GAMES: str = "game-media"
    DEBUG: bool = False
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

# Ensure the SQLite database directory exists (required on Azure App Service
# where /home/data/ is a persistent mount that may not be pre-created).
# Uses re.sub to correctly strip "sqlite:///" prefix (lstrip strips chars, not substring).
if settings.DATABASE_URL.startswith("sqlite"):
    _db_file = re.sub(r"^sqlite:///", "", settings.DATABASE_URL)
    _db_dir = Path(_db_file).parent
    if str(_db_dir) not in (".", ""):
        os.makedirs(_db_dir, exist_ok=True)

# SQLite-specific connection args (check_same_thread=False for multi-threaded FastAPI)
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All SQLAlchemy models inherit from this base."""
    pass


def get_db():
    """FastAPI dependency that yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
