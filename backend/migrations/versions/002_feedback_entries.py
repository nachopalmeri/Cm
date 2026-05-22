"""Add feedback_entries table for structured feedback storage

Revision ID: 002
Revises: 001
Create Date: 2026-05-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "feedback_entries",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("brand_profile_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("draft_id", sa.String(255), nullable=False),
        sa.Column("draft_text", sa.Text, nullable=False),
        sa.Column("approved", sa.Boolean, nullable=False),
        sa.Column("correction", sa.Text, nullable=True),
        sa.Column("replaced_phrases", sa.Text, nullable=True),
        sa.Column("new_topics", sa.Text, nullable=True),
        sa.Column("structural_diff", sa.Text, nullable=True),
        sa.Column("word_count_draft", sa.Integer, nullable=True),
        sa.Column("word_count_correction", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index(
        "ix_feedback_entries_brand",
        "feedback_entries",
        ["brand_profile_id", "approved"],
    )


def downgrade() -> None:
    op.drop_table("feedback_entries")
