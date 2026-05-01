"""
routers/feedback.py
-------------------
Endpoints for user-submitted game / app suggestions.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Feedback
from schemas import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/", response_model=FeedbackRead, status_code=201)
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    """Submit a request for a new game or app."""
    entry = Feedback(
        game_title=payload.game_title.strip(),
        submitted_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/", response_model=list[FeedbackRead])
def list_feedback(db: Session = Depends(get_db)):
    """Return all submitted feedback entries (admin use)."""
    return db.query(Feedback).order_by(Feedback.submitted_at.desc()).all()
