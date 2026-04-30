"""
routers/admin.py
----------------
Admin-only endpoints:
  - Upload game thumbnail / preview video to Azure Blob Storage
  - Create/update game and headset records

NOTE: In production, protect these endpoints with an API key or
      integrate with the existing admin auth mechanism.
"""
from __future__ import annotations
from datetime import date
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Game, Headset, GameInstallation
from schemas import GameCreate, GameRead, HeadsetRead, InstallationCreate, InstallationRead, MediaUploadResponse
from storage import upload_game_media

router = APIRouter(prefix="/admin", tags=["Admin"])

# ---------------------------------------------------------------------------
# Game management
# ---------------------------------------------------------------------------

@router.post("/games", response_model=GameRead, status_code=201)
def create_game(payload: GameCreate, db: Session = Depends(get_db)):
    """Create a new game entry."""
    game = Game(**payload.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.patch("/games/{game_id}", response_model=GameRead)
def update_game(game_id: int, payload: GameCreate, db: Session = Depends(get_db)):
    """Full update of a game record."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(game, field, value)
    db.commit()
    db.refresh(game)
    return game


@router.post("/games/{game_id}/upload-thumbnail", response_model=MediaUploadResponse)
async def upload_thumbnail(
    game_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a thumbnail image for a game; saves URL to DB."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    data = await file.read()
    url = upload_game_media(game_id, "thumbnail", data, file.filename or "thumbnail.jpg")
    game.thumbnail_url = url
    db.commit()
    return MediaUploadResponse(blob_url=url, message="Thumbnail uploaded successfully")


@router.post("/games/{game_id}/upload-video", response_model=MediaUploadResponse)
async def upload_video(
    game_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a preview video for a game; saves URL to DB."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    allowed_types = {"video/mp4", "video/webm", "video/quicktime"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported video type: {file.content_type}")

    data = await file.read()
    url = upload_game_media(game_id, "video", data, file.filename or "preview.mp4")
    game.video_url = url
    db.commit()
    return MediaUploadResponse(blob_url=url, message="Video uploaded successfully")


# ---------------------------------------------------------------------------
# Headset management
# ---------------------------------------------------------------------------

@router.post("/headsets", response_model=HeadsetRead, status_code=201)
def create_headset(code: str, model: str = "Meta Quest 3", db: Session = Depends(get_db)):
    """Register a new headset."""
    from sqlalchemy import select
    exists = db.scalar(select(Headset).where(Headset.code == code))
    if exists:
        raise HTTPException(status_code=409, detail=f"Headset '{code}' already exists")
    headset = Headset(code=code, model=model)
    db.add(headset)
    db.commit()
    db.refresh(headset)
    return headset


# ---------------------------------------------------------------------------
# Installation management
# ---------------------------------------------------------------------------

@router.post("/installations", response_model=InstallationRead, status_code=201)
def create_installation(payload: InstallationCreate, db: Session = Depends(get_db)):
    """Link a game to a headset with an install and expiry date."""
    from sqlalchemy import select
    game = db.get(Game, payload.game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game {payload.game_id} not found")
    headset = db.get(Headset, payload.headset_id)
    if not headset:
        raise HTTPException(status_code=404, detail=f"Headset {payload.headset_id} not found")
    inst = GameInstallation(
        game_id=payload.game_id,
        headset_id=payload.headset_id,
        install_date=payload.install_date,
        expiry_date=payload.expiry_date,
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return InstallationRead(
        id=inst.id,
        game_id=inst.game_id,
        headset_id=inst.headset_id,
        headset_code=inst.headset.code,
        headset_model=inst.headset.model,
        install_date=inst.install_date,
        expiry_date=inst.expiry_date,
        installation_status="EXPIRED" if inst.is_expired else ("EXPIRING_SOON" if inst.is_expiring_soon else "ACTIVE"),
    )
