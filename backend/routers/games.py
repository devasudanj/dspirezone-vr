"""
routers/games.py
----------------
Endpoints for browsing the VR game library.
"""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Game, GameInstallation, GameStatus, GameCategory
from schemas import GameRead, GameListItem, InstallationRead

router = APIRouter(prefix="/games", tags=["Games"])


def _installation_status(inst: GameInstallation) -> str:
    if inst.is_expired:
        return "EXPIRED"
    if inst.is_expiring_soon:
        return "EXPIRING_SOON"
    return "ACTIVE"


@router.get("/", response_model=list[GameListItem])
def list_games(
    category: Optional[GameCategory] = Query(None, description="Filter by category"),
    status: Optional[GameStatus] = Query(GameStatus.ACTIVE, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """
    Return the full game library, optionally filtered by category and/or status.
    Defaults to only ACTIVE games.
    """
    stmt = select(Game)
    if status:
        stmt = stmt.where(Game.status == status)
    if category:
        stmt = stmt.where(Game.category == category)
    stmt = stmt.order_by(Game.name)
    return db.scalars(stmt).all()


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db)):
    """Return full detail for a single game."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post("/{game_id}/visit", response_model=GameRead)
def record_visit(game_id: int, db: Session = Depends(get_db)):
    """Increment the visit counter each time the game detail page is viewed."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game.visit_count = (game.visit_count or 0) + 1
    db.commit()
    db.refresh(game)
    return game


@router.get("/{game_id}/installations", response_model=list[InstallationRead])
def list_game_installations(
    game_id: int,
    active_only: bool = Query(False, description="If true, only return non-expired installations"),
    db: Session = Depends(get_db),
):
    """
    Return all headset installations for a game, with computed status labels.
    Pass ?active_only=true to hide expired installations (e.g., for headset selection).
    """
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    installations = game.installations

    if active_only:
        installations = [i for i in installations if not i.is_expired]

    result: list[InstallationRead] = []
    for inst in installations:
        result.append(
            InstallationRead(
                id=inst.id,
                game_id=inst.game_id,
                headset_id=inst.headset_id,
                headset_code=inst.headset.code,
                headset_model=inst.headset.model,
                install_date=inst.install_date,
                expiry_date=inst.expiry_date,
                installation_status=_installation_status(inst),
            )
        )
    return result
