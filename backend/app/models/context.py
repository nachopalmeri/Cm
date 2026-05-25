"""Context model: ContextEntry."""
import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.db.pgvector import JSONBCompat
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, SoftDeleteMixin


class ContextEntry(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "context_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_profile_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False
    )
    entry_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # ContextEntryType enum value: project, event, milestone, learning, personal
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    relevance_start: Mapped[Optional[str]] = mapped_column(Date, nullable=True)
    # When this context becomes relevant
    relevance_end: Mapped[Optional[str]] = mapped_column(Date, nullable=True)
    # When this context stops being relevant
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # active, completed, upcoming, archived
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)

    # Relationships
    brand_profile: Mapped["BrandProfile"] = relationship(back_populates="context_entries")
    # Note: embedding relationship removed - query via EmbeddingRepository instead

    def __repr__(self) -> str:
        return f"<ContextEntry {self.entry_type}: {self.title}>"


# Late import
from app.models.brand import BrandProfile  # noqa: E402
from app.models.embedding import MemoryEmbedding  # noqa: E402
