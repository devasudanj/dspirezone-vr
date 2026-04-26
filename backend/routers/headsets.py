"""
routers/headsets.py
-------------------
Endpoints for listing and inspecting VR headsets.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Headset
from schemas import HeadsetRead

router = APIRouter(prefix="/headsets", tags=["Headsets"])


@router.get("/", response_model=list[HeadsetRead])
def list_headsets(db: Session = Depends(get_db)):
    """Return all registered headsets."""
    return db.scalars(select(Headset).order_by(Headset.code)).all()


@router.get("/{headset_id}", response_model=HeadsetRead)
def get_headset(headset_id: int, db: Session = Depends(get_db)):
    headset = db.get(Headset, headset_id)
    if not headset:
        raise HTTPException(status_code=404, detail="Headset not found")
    return headset
