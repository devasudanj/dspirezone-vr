"""Add viewable_age, youtube_url, is_multiplayer, visit_count to games table.

Revision ID: 002
Revises: 001
Create Date: 2026-04-29 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("games", sa.Column("youtube_url", sa.String(1024), nullable=True))
    op.add_column("games", sa.Column("viewable_age", sa.Integer(), nullable=True))
    op.add_column(
        "games",
        sa.Column("is_multiplayer", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "games",
        sa.Column("visit_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("games", "visit_count")
    op.drop_column("games", "is_multiplayer")
    op.drop_column("games", "viewable_age")
    op.drop_column("games", "youtube_url")
