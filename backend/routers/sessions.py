"""
routers/sessions.py
-------------------
Endpoints for creating and retrieving play sessions.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from database import get_db
from models import Session as SessionModel, Game, GameInstallation, VALID_DURATIONS
from schemas import SessionCreate, SessionRead

router = APIRouter(prefix="/sessions", tags=["Sessions"])


def _build_session_read(session: SessionModel, db: DBSession) -> SessionRead:
    """Build a SessionRead, collecting all active headsets that have the game installed."""
    installations = (
        db.query(GameInstallation)
        .filter(GameInstallation.game_id == session.game_id)
        .all()
    )
    headset_codes = [
        inst.headset.code
        for inst in installations
        if not inst.is_expired and inst.headset.is_active
    ]
    return SessionRead(
        id=session.id,
        session_code=session.session_code,
        game_id=session.game_id,
        duration_minutes=session.duration_minutes,
        created_at=session.created_at,
        game_name=session.game.name,
        headset_codes=headset_codes,
    )


@router.post("/", response_model=SessionRead, status_code=201)
def create_session(payload: SessionCreate, db: DBSession = Depends(get_db)):
    """
    Create a new play session.

    Validation rules:
    - Game must exist and be ACTIVE.
    - At least one non-expired active installation must exist for the game.
    - Duration must be one of 10, 30, 45, or 60 minutes.
    - Headset is NOT chosen by the player; the first available headset is used
      for record-keeping purposes only.
    """
    # Validate duration
    if payload.duration_minutes not in VALID_DURATIONS:
        raise HTTPException(
            status_code=422,
            detail=f"duration_minutes must be one of {sorted(VALID_DURATIONS)}",
        )

    # Validate game
    game = db.get(Game, payload.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=f"Game '{game.name}' is not active (status: {game.status})",
        )

    # Find all active, non-expired installations for this game
    installations = (
        db.query(GameInstallation)
        .filter(GameInstallation.game_id == payload.game_id)
        .all()
    )
    available = [
        inst for inst in installations
        if not inst.is_expired and inst.headset.is_active
    ]
    if not available:
        raise HTTPException(
            status_code=400,
            detail="No active headset installations available for this game.",
        )

    # Use the first available headset for DB FK storage
    first_headset_id = available[0].headset_id

    # Create session record
    new_session = SessionModel(
        session_code=SessionModel.generate_session_code(),
        game_id=payload.game_id,
        headset_id=first_headset_id,
        duration_minutes=payload.duration_minutes,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return _build_session_read(new_session, db)


@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    """Retrieve a session by ID (used to re-print a slip)."""
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _build_session_read(session, db)
