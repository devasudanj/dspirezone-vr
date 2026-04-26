"""Initial schema – creates games, headsets, game_installations, sessions tables.

Revision ID: 001
Revises: 
Create Date: 2024-04-24 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "games",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "category",
            sa.Enum(
                "Action", "Adventure", "Kids", "Horror",
                "Educational", "Sports", "Simulation", "Puzzle", "Other",
                name="game_category",
            ),
            nullable=False,
            server_default="Other",
        ),
        sa.Column("thumbnail_url", sa.String(1024), nullable=False, server_default=""),
        sa.Column("video_url", sa.String(1024), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "EXPIRED", "DISABLED", name="game_status"),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "headsets",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("code", sa.String(20), nullable=False, unique=True),
        sa.Column("model", sa.String(255), nullable=False, server_default="Meta Quest 3"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "game_installations",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("game_id", sa.Integer(), sa.ForeignKey("games.id"), nullable=False),
        sa.Column("headset_id", sa.Integer(), sa.ForeignKey("headsets.id"), nullable=False),
        sa.Column("install_date", sa.Date(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.UniqueConstraint("game_id", "headset_id", name="uq_game_headset"),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("session_code", sa.String(50), nullable=False, unique=True),
        sa.Column("game_id", sa.Integer(), sa.ForeignKey("games.id"), nullable=False),
        sa.Column("headset_id", sa.Integer(), sa.ForeignKey("headsets.id"), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("sessions")
    op.drop_table("game_installations")
    op.drop_table("headsets")
    op.drop_table("games")
