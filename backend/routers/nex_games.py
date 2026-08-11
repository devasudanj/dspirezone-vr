"""
routers/nex_games.py
--------------------
Compatibility endpoints for the Nex Playground mobile flow.

These routes currently reuse the existing games table so the mobile app can
load Nex games from `/api/nex-games/` without 404 errors.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Game, GameCategory, GameStatus
from schemas import GameListItem, GameRead


router = APIRouter(prefix="/api/nex-games", tags=["Nex Games"])


def _normalize_category(category: Optional[str]) -> Optional[str]:
    if category is None:
        return None
    return category.strip()


@router.get("/", response_model=list[GameListItem])
def list_nex_games(
    category: Optional[str] = Query(None, description="Optional Nex category filter"),
    status: Optional[GameStatus] = Query(GameStatus.ACTIVE, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """
    Return the Nex game listing consumed by the mobile app.

    Category compatibility behavior:
    - Standard categories (Action, Sports, Kids, etc.) map directly.
    - "Multiplayer" filters by is_multiplayer=True.
    - Unknown categories return an empty list instead of a 422 validation error.
    """
    normalized_category = _normalize_category(category)

    stmt = select(Game)
    if status:
        stmt = stmt.where(Game.status == status)

    if normalized_category:
        valid_categories = {c.value for c in GameCategory}
        if normalized_category == "Multiplayer":
            stmt = stmt.where(Game.is_multiplayer.is_(True))
        elif normalized_category in valid_categories:
            stmt = stmt.where(Game.category == normalized_category)
        else:
            return []

    stmt = stmt.order_by(Game.name)
    return db.scalars(stmt).all()


@router.get("/{game_id}", response_model=GameRead)
def get_nex_game(game_id: int, db: Session = Depends(get_db)):
    """Return full details for a single Nex game entry."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post("/{game_id}/visit", response_model=GameRead)
def record_nex_visit(game_id: int, db: Session = Depends(get_db)):
    """Increment visit count for a Nex game detail view."""
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game.visit_count = (game.visit_count or 0) + 1
    db.commit()
    db.refresh(game)
    return game
