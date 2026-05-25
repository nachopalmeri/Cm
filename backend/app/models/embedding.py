"""Embedding model: MemoryEmbedding with pgvector support."""
import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Text as SAText
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
from app.db.pgvector import Vector
from app.models.enums import EmbeddingSourceType


class MemoryEmbedding(Base, TimestampMixin):
    __tablename__ = "memory_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # EmbeddingSourceType enum value
    source_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), nullable=False
    )
    # Polymorphic FK — points to the source entity's ID
    embedding: Mapped[Optional[list]] = mapped_column(
        Vector(dim=1536), nullable=True
    )
    # pgvector VECTOR(1536) in Postgres, JSON in SQLite
    embedding_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # e.g. "text-embedding-ada-002"
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    # SHA-256 hash of source content for cache invalidation

    # Note: Polymorphic relationships removed - use EmbeddingRepository for lookups
    # The source_type + source_id pattern allows any entity to have an embedding
    # Query via: repo.get_by_source(source_type, source_id)

    def __repr__(self) -> str:
        return f"<MemoryEmbedding {self.source_type}:{self.source_id}>"


# Late imports
from app.models.brand import BrandMemoryEntry  # noqa: E402
from app.models.content import ContentIdea  # noqa: E402
from app.models.context import ContextEntry  # noqa: E402
from app.models.audience import AudienceInsight  # noqa: E402
