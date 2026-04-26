"""
schemas.py
----------
Pydantic v2 request/response models for Dspire VR Zone REST API.
These form the contract between the FastAPI backend and the React Native client.
"""
from __future__ import annotations
from datetime import datetime, date
from typing import Literal, Optional
from pydantic import BaseModel, HttpUrl, field_validator, model_validator
from models import GameStatus, GameCategory, VALID_DURATIONS


# ---------------------------------------------------------------------------
# Enums re-exported for schema usage
# ---------------------------------------------------------------------------

InstallationStatus = Literal["ACTIVE", "EXPIRING_SOON", "EXPIRED"]


# ---------------------------------------------------------------------------
# Headset schemas
# ---------------------------------------------------------------------------

class HeadsetBase(BaseModel):
    code: str
    model: str
    is_active: bool


class HeadsetRead(HeadsetBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Game schemas
# ---------------------------------------------------------------------------

class GameBase(BaseModel):
    name: str
    description: str
    category: GameCategory
    thumbnail_url: str
    video_url: Optional[str] = None
    status: GameStatus = GameStatus.ACTIVE


class GameCreate(GameBase):
    pass


class GameRead(GameBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class GameListItem(BaseModel):
    """Lightweight representation used in the game library listing."""
    id: int
    name: str
    category: GameCategory
    thumbnail_url: str
    status: GameStatus

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Installation schemas
# ---------------------------------------------------------------------------

class InstallationRead(BaseModel):
    id: int
    game_id: int
    headset_id: int
    headset_code: str
    headset_model: str
    install_date: date
    expiry_date: date
    installation_status: InstallationStatus  # computed field

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    game_id: int
    headset_id: int
    duration_minutes: int

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v not in VALID_DURATIONS:
            raise ValueError(
                f"duration_minutes must be one of {sorted(VALID_DURATIONS)}, got {v}"
            )
        return v


class SessionRead(BaseModel):
    id: int
    session_code: str
    game_id: int
    headset_id: int
    duration_minutes: int
    created_at: datetime

    # Denormalized for the printed slip (avoids extra round-trips)
    game_name: str
    headset_code: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Media upload response
# ---------------------------------------------------------------------------

class MediaUploadResponse(BaseModel):
    blob_url: str
    message: str
