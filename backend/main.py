"""
main.py
-------
FastAPI application entry point for Dspire VR Zone backend.

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import inspect as sa_inspect, text
from database import engine, Base, settings
from routers import games, headsets, sessions, admin, feedback


# ---------------------------------------------------------------------------
# Inline schema migration: add new columns to existing tables if missing.
# This runs before create_all so deployments upgrading from an older schema
# get the new columns without requiring a full Alembic run at startup.
# ---------------------------------------------------------------------------
def _apply_schema_upgrades() -> None:
    cols = {c["name"] for c in sa_inspect(engine).get_columns("games")}
    new_columns = [
        ("youtube_url",    "ALTER TABLE games ADD COLUMN youtube_url VARCHAR(1024)"),
        ("viewable_age",   "ALTER TABLE games ADD COLUMN viewable_age INTEGER"),
        ("is_multiplayer", "ALTER TABLE games ADD COLUMN is_multiplayer BOOLEAN NOT NULL DEFAULT 0"),
        ("visit_count",    "ALTER TABLE games ADD COLUMN visit_count INTEGER NOT NULL DEFAULT 0"),
    ]
    with engine.begin() as conn:
        for col_name, ddl in new_columns:
            if col_name not in cols:
                conn.execute(text(ddl))


try:
    _apply_schema_upgrades()
except Exception:  # table may not exist yet on a brand-new deployment
    pass

# Create any brand-new tables (idempotent)
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Dspire VR Zone API",
    description="Backend API for the Dspire VR Zone gaming center management system.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS – allow the React Native app and the existing admin portal
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(games.router)
app.include_router(headsets.router)
app.include_router(sessions.router)
app.include_router(admin.router)
app.include_router(feedback.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Dspire VR Zone API"}
