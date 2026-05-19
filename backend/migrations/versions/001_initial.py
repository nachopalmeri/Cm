"""Initial schema — all tables + pgvector extension

Revision ID: 001
Revises: None
Create Date: 2026-05-16
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

# revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create pgvector extension (idempotent — no-op on SQLite)
    dialect = op.get_context().dialect.name
    if dialect == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # brand_profiles
    op.create_table(
        "brand_profiles",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("voice", sa.Text, nullable=True),
        sa.Column("tone", sa.Text, nullable=True),
        sa.Column("personality", sa.Text, nullable=True),
        sa.Column("opinions", sa.Text, nullable=True),
        sa.Column("style", sa.Text, nullable=True),
        sa.Column("sensitive_topics", sa.Text, nullable=True),
        sa.Column("primary_platforms", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # brand_memory_entries
    op.create_table(
        "brand_memory_entries",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("brand_profile_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # content_ideas
    op.create_table(
        "content_ideas",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("brand_profile_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("pillar", sa.String(255), nullable=True),
        sa.Column("target_platform", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # content_assets
    op.create_table(
        "content_assets",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("content_idea_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("content_ideas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_type", sa.String(100), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("hook", sa.Text, nullable=True),
        sa.Column("cta", sa.Text, nullable=True),
        sa.Column("hashtags", sa.Text, nullable=True),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # content_performances
    op.create_table(
        "content_performances",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("content_asset_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("content_assets.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("impressions", sa.Integer, nullable=True),
        sa.Column("likes", sa.Integer, nullable=True),
        sa.Column("comments", sa.Integer, nullable=True),
        sa.Column("shares", sa.Integer, nullable=True),
        sa.Column("saves", sa.Integer, nullable=True),
        sa.Column("clicks", sa.Integer, nullable=True),
        sa.Column("ctr", sa.Float, nullable=True),
        sa.Column("engagement_rate", sa.Float, nullable=True),
        sa.Column("reach", sa.Integer, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("measured_at", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # audience_insights
    op.create_table(
        "audience_insights",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("brand_profile_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("segment", sa.String(100), nullable=False),
        sa.Column("insight_type", sa.String(100), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # context_entries
    op.create_table(
        "context_entries",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("brand_profile_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("entry_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("relevance_start", sa.Date, nullable=True),
        sa.Column("relevance_end", sa.Date, nullable=True),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # memory_embeddings
    op.create_table(
        "memory_embeddings",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("source_type", sa.String(50), nullable=False),
        sa.Column("source_id", PGUUID(as_uuid=True), nullable=False),
        sa.Column("embedding", sa.Text, nullable=True),
        # In Postgres this becomes VECTOR(1536) via ALTER below
        sa.Column("embedding_model", sa.String(100), nullable=True),
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Alter embedding column to vector type on Postgres
    if dialect == "postgresql":
        op.execute("ALTER TABLE memory_embeddings ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector")

    # workflow_runs
    op.create_table(
        "workflow_runs",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("brand_profile_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workflow_type", sa.String(100), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="running"),
        sa.Column("input_data", sa.JSON, nullable=True),
        sa.Column("output_data", sa.JSON, nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("total_tokens", sa.Integer, nullable=True),
        sa.Column("total_cost_usd", sa.Float, nullable=True),
        sa.Column("duration_seconds", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # agent_traces
    op.create_table(
        "agent_traces",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("workflow_run_id", PGUUID(as_uuid=True),
                  sa.ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("agent_name", sa.String(100), nullable=False),
        sa.Column("step_order", sa.Integer, nullable=False),
        sa.Column("input_summary", sa.Text, nullable=True),
        sa.Column("output_summary", sa.Text, nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("tokens_used", sa.Integer, nullable=True),
        sa.Column("cost_usd", sa.Float, nullable=True),
        sa.Column("duration_seconds", sa.Float, nullable=True),
        sa.Column("prompt_version", sa.String(50), nullable=True),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Indexes
    op.create_index("ix_brand_memory_entries_brand", "brand_memory_entries", ["brand_profile_id", "category"])
    op.create_index("ix_content_ideas_brand", "content_ideas", ["brand_profile_id", "status"])
    op.create_index("ix_content_assets_idea", "content_assets", ["content_idea_id", "platform"])
    op.create_index("ix_audience_insights_brand", "audience_insights", ["brand_profile_id", "segment"])
    op.create_index("ix_context_entries_brand", "context_entries", ["brand_profile_id", "entry_type"])
    op.create_index("ix_memory_embeddings_source", "memory_embeddings", ["source_type", "source_id"], unique=True)
    op.create_index("ix_workflow_runs_brand", "workflow_runs", ["brand_profile_id", "status"])

    # pgvector similarity index (HNSW) — only on Postgres with enough data
    if dialect == "postgresql":
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_memory_embeddings_vector "
            "ON memory_embeddings USING hnsw (embedding vector_cosine_ops)"
        )


def downgrade() -> None:
    op.drop_table("agent_traces")
    op.drop_table("workflow_runs")
    op.drop_table("memory_embeddings")
    op.drop_table("context_entries")
    op.drop_table("audience_insights")
    op.drop_table("content_performances")
    op.drop_table("content_assets")
    op.drop_table("content_ideas")
    op.drop_table("brand_memory_entries")
    op.drop_table("brand_profiles")

    dialect = op.get_context().dialect.name
    if dialect == "postgresql":
        op.execute("DROP EXTENSION IF EXISTS vector CASCADE")
