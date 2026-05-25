"""Audience model: AudienceInsight."""
import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Float, Integer
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.db.pgvector import JSONBCompat
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, SoftDeleteMixin


class AudienceInsight(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "audience_insights"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_profile_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False
    )
    segment: Mapped[str] = mapped_column(String(100), nullable=False)
    # AudienceSegment enum value
    insight_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # best_time, best_format, top_hook, top_topic, engagement_pattern
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # The actual insight text
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # analytics, agent_observation, user_input
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)

    # Relationships
    brand_profile: Mapped["BrandProfile"] = relationship(back_populates="audience_insights")
    # Note: embedding relationship removed - query via EmbeddingRepository instead

    def __repr__(self) -> str:
        return f"<AudienceInsight {self.insight_type}>"


# Late import
from app.models.brand import BrandProfile  # noqa: E402
from app.models.embedding import MemoryEmbedding  # noqa: E402
