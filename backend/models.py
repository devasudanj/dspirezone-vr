"""
models.py
---------
SQLAlchemy ORM models for Dspire VR Zone.

Entity relationships:
  Game  ──< GameInstallation >── Headset
  Game  ──< Session
  Headset ──< Session
"""
import uuid
from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import (
    Integer, String, Text, Boolean, Date, DateTime,
    ForeignKey, Enum as SAEnum, UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database import Base


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class GameStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    DISABLED = "DISABLED"


class GameCategory(str, PyEnum):
    ACTION = "Action"
    ADVENTURE = "Adventure"
    KIDS = "Kids"
    HORROR = "Horror"
    EDUCATIONAL = "Educational"
    SPORTS = "Sports"
    SIMULATION = "Simulation"
    PUZZLE = "Puzzle"
    OTHER = "Other"


VALID_DURATIONS = {10, 30, 45, 60}  # allowed session durations in minutes


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str] = mapped_column(
        SAEnum(GameCategory, name="game_category"),
        nullable=False,
        default=GameCategory.OTHER,
    )
    thumbnail_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="")
    video_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    youtube_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    viewable_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_multiplayer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    visit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        SAEnum(GameStatus, name="game_status"),
        nullable=False,
        default=GameStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    installations: Mapped[list["GameInstallation"]] = relationship(
        "GameInstallation", back_populates="game", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="game"
    )


class Headset(Base):
    __tablename__ = "headsets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Human-readable code visible on physical device – e.g., DZ1, DZ2
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(255), nullable=False, default="Meta Quest 3")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    installations: Mapped[list["GameInstallation"]] = relationship(
        "GameInstallation", back_populates="headset", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="headset"
    )


class GameInstallation(Base):
    """Tracks which game is installed on which headset and its licence window."""
    __tablename__ = "game_installations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    headset_id: Mapped[int] = mapped_column(Integer, ForeignKey("headsets.id"), nullable=False)
    install_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)

    __table_args__ = (
        # A game can only be installed once per headset at a time
        UniqueConstraint("game_id", "headset_id", name="uq_game_headset"),
    )

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="installations")
    headset: Mapped["Headset"] = relationship("Headset", back_populates="installations")

    @property
    def is_expired(self) -> bool:
        return date.today() > self.expiry_date

    @property
    def is_expiring_soon(self) -> bool:
        """Returns True if expiry is within 7 days but not yet expired."""
        from datetime import timedelta
        if self.is_expired:
            return False
        return (self.expiry_date - date.today()).days <= 7


class Session(Base):
    """A completed or in-progress play session booking."""
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Unique human-readable session code for the printed slip, e.g. DZ-20240424-XXXX
    session_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    headset_id: Mapped[int] = mapped_column(Integer, ForeignKey("headsets.id"), nullable=False)
    # Must be one of VALID_DURATIONS (enforced in API layer)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="sessions")
    headset: Mapped["Headset"] = relationship("Headset", back_populates="sessions")

    @staticmethod
    def generate_session_code() -> str:
        """Generate a unique session code like DZ-20240424-A3F2."""
        today = datetime.utcnow().strftime("%Y%m%d")
        suffix = uuid.uuid4().hex[:4].upper()
        return f"DZ-{today}-{suffix}"


class Feedback(Base):
    """User-submitted game / app requests."""
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_title: Mapped[str] = mapped_column(String(500), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
