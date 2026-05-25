"""Brand models: BrandProfile and BrandMemoryEntry."""
import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, SoftDeleteMixin
from app.models.enums import Platform


class BrandProfile(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "brand_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    voice: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tone: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    personality: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    opinions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    style: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sensitive_topics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primary_platforms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Comma-separated Platform enum values for primary platforms

    # Relationships
    memory_entries: Mapped[list["BrandMemoryEntry"]] = relationship(
        back_populates="brand_profile", lazy="selectin"
    )
    content_ideas: Mapped[list["ContentIdea"]] = relationship(
        back_populates="brand_profile", lazy="selectin"
    )
    audience_insights: Mapped[list["AudienceInsight"]] = relationship(
        back_populates="brand_profile", lazy="selectin"
    )
    context_entries: Mapped[list["ContextEntry"]] = relationship(
        back_populates="brand_profile", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<BrandProfile {self.name}>"


class BrandMemoryEntry(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "brand_memory_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_profile_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    # voice, tone, personality, opinions, style, sensitive_topics, custom
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Where did this memory come from? user_input, agent_observation, analytics
    confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    # 0.0-1.0 how confident we are about this memory

    # Relationships
    brand_profile: Mapped["BrandProfile"] = relationship(back_populates="memory_entries")
    # Note: embedding relationship removed - query via EmbeddingRepository instead

    def __repr__(self) -> str:
        return f"<BrandMemoryEntry {self.category}>"


# Late import to avoid circular
from app.models.content import ContentIdea  # noqa: E402
from app.models.audience import AudienceInsight  # noqa: E402
from app.models.context import ContextEntry  # noqa: E402
from app.models.embedding import MemoryEmbedding  # noqa: E402
