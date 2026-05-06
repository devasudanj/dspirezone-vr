"""
conftest.py
-----------
Shared pytest fixtures for Dspire VR Zone backend tests.

Uses an in-memory SQLite database so tests are fast and isolated.
"""
import os
import sys
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base, get_db
from models import Game, Headset, GameInstallation, GameCategory, GameStatus
from main import app

# ---------------------------------------------------------------------------
# In-memory SQLite engine shared by all tests in a session
# ---------------------------------------------------------------------------
TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def db():
    """Provide a raw SQLAlchemy session for direct DB assertions."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    """FastAPI TestClient wired to the in-memory database."""
    return TestClient(app)


@pytest.fixture()
def seed_data(db):
    """
    Insert a small set of games, headsets, and installations.
    Returns a dict with the created objects for easy reference.
    """
    # Games
    games = [
        Game(
            name="Beat Saber",
            description="Slash beats to the rhythm.",
            category=GameCategory.ACTION,
            thumbnail_url="https://example.com/beat_saber.jpg",
            status=GameStatus.ACTIVE,
        ),
        Game(
            name="Superhot VR",
            description="Time moves only when you move.",
            category=GameCategory.ACTION,
            thumbnail_url="https://example.com/superhot.jpg",
            status=GameStatus.ACTIVE,
        ),
        Game(
            name="Gorilla Tag",
            description="Run, climb and tag other gorillas.",
            category=GameCategory.ADVENTURE,
            thumbnail_url="https://example.com/gorilla_tag.jpg",
            status=GameStatus.ACTIVE,
        ),
        Game(
            name="Retired Game",
            description="This game is disabled.",
            category=GameCategory.OTHER,
            thumbnail_url="https://example.com/retired.jpg",
            status=GameStatus.DISABLED,
        ),
    ]
    db.add_all(games)
    db.flush()

    # Headsets
    headsets = [
        Headset(code="DZ1", model="Meta Quest 3", is_active=True),
        Headset(code="DZ2", model="Meta Quest 3", is_active=True),
        Headset(code="DZ3", model="Meta Quest 2", is_active=False),
    ]
    db.add_all(headsets)
    db.flush()

    # Installations
    today = date.today()
    installations = [
        # Beat Saber on DZ1 – active (90 days)
        GameInstallation(
            game_id=games[0].id,
            headset_id=headsets[0].id,
            install_date=today,
            expiry_date=today + timedelta(days=90),
        ),
        # Beat Saber on DZ2 – expiring soon (5 days)
        GameInstallation(
            game_id=games[0].id,
            headset_id=headsets[1].id,
            install_date=today - timedelta(days=25),
            expiry_date=today + timedelta(days=5),
        ),
        # Beat Saber on DZ3 – expired
        GameInstallation(
            game_id=games[0].id,
            headset_id=headsets[2].id,
            install_date=today - timedelta(days=60),
            expiry_date=today - timedelta(days=2),
        ),
        # Superhot on DZ1 – active
        GameInstallation(
            game_id=games[1].id,
            headset_id=headsets[0].id,
            install_date=today,
            expiry_date=today + timedelta(days=120),
        ),
    ]
    db.add_all(installations)
    db.commit()

    return {
        "games": games,
        "headsets": headsets,
        "installations": installations,
    }
