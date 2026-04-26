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


def _build_session_read(session: SessionModel) -> SessionRead:
    return SessionRead(
        id=session.id,
        session_code=session.session_code,
        game_id=session.game_id,
        headset_id=session.headset_id,
        duration_minutes=session.duration_minutes,
        created_at=session.created_at,
        game_name=session.game.name,
        headset_code=session.headset.code,
    )


@router.post("/", response_model=SessionRead, status_code=201)
def create_session(payload: SessionCreate, db: DBSession = Depends(get_db)):
    """
    Create a new play session.

    Validation rules enforced server-side:
    - Game must exist and be ACTIVE.
    - Headset must be active.
    - A non-expired GameInstallation for (game, headset) must exist.
    - Duration must be one of 10, 30, 45, or 60 minutes.
    """
    # Validate duration (also validated by Pydantic, belt-and-suspenders)
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

    # Validate headset via installation lookup
    installation: GameInstallation | None = (
        db.query(GameInstallation)
        .filter(
            GameInstallation.game_id == payload.game_id,
            GameInstallation.headset_id == payload.headset_id,
        )
        .first()
    )
    if not installation:
        raise HTTPException(
            status_code=400,
            detail="This game is not installed on the selected headset",
        )
    if installation.is_expired:
        raise HTTPException(
            status_code=400,
            detail=f"Installation expired on {installation.expiry_date}. Cannot start session.",
        )
    if not installation.headset.is_active:
        raise HTTPException(status_code=400, detail="The selected headset is inactive")

    # Create session record
    new_session = SessionModel(
        session_code=SessionModel.generate_session_code(),
        game_id=payload.game_id,
        headset_id=payload.headset_id,
        duration_minutes=payload.duration_minutes,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return _build_session_read(new_session)


@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    """Retrieve a session by ID (used to re-print a slip)."""
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _build_session_read(session)
