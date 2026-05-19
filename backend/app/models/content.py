"""Content models: ContentIdea, ContentAsset, ContentPerformance."""
import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Float, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.db.pgvector import JSONBCompat
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, SoftDeleteMixin
from app.models.enums import ContentStatus, Platform


class ContentIdea(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "content_ideas"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_profile_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pillar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Content pillar this idea belongs to
    target_platform: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Platform enum value
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ContentStatus.draft.value
    )
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Where did this idea come from? weekly_brief, strategist, repurposed
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)

    # Relationships
    brand_profile: Mapped["BrandProfile"] = relationship(back_populates="content_ideas")
    assets: Mapped[list["ContentAsset"]] = relationship(
        back_populates="content_idea", lazy="selectin"
    )
    # Note: embedding relationship removed - query via EmbeddingRepository instead

    def __repr__(self) -> str:
        return f"<ContentIdea {self.title}>"


class ContentAsset(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "content_assets"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_idea_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("content_ideas.id", ondelete="CASCADE"), nullable=False
    )
    asset_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # post, thread, newsletter_draft, tiktok_pack, caption, carousel, clip
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    # Platform enum value
    body: Mapped[str] = mapped_column(Text, nullable=False)
    # The actual content text/script
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ContentStatus.draft.value
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    # Tracks rewrites/edits
    hook: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hashtags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Comma-separated or JSON
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)
    # Platform-specific metadata (e.g. TikTok timeline, visual instructions)

    # Relationships
    content_idea: Mapped["ContentIdea"] = relationship(back_populates="assets")
    performance: Mapped[Optional["ContentPerformance"]] = relationship(
        back_populates="content_asset", lazy="selectin", uselist=False
    )

    def __repr__(self) -> str:
        return f"<ContentAsset {self.asset_type} v{self.version}>"


class ContentPerformance(Base, TimestampMixin):
    __tablename__ = "content_performances"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_asset_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("content_assets.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    impressions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    likes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    shares: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    saves: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    clicks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ctr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    engagement_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reach: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Human or agent notes about performance
    measured_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # ISO timestamp when metrics were captured

    # Relationships
    content_asset: Mapped["ContentAsset"] = relationship(back_populates="performance")

    def __repr__(self) -> str:
        return f"<ContentPerformance asset={self.content_asset_id}>"
