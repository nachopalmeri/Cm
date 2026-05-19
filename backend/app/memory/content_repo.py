"""Content memory repository — ideas, assets, performance history."""
import uuid
from typing import Optional, Sequence
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.content import ContentIdea, ContentAsset, ContentPerformance
from app.memory.base_repo import BaseRepository


class ContentMemoryRepository:
    """High-level repository for Content Memory operations."""

    def __init__(self, session: Session):
        self.session = session
        self.ideas = BaseRepository(ContentIdea, session)
        self.assets = BaseRepository(ContentAsset, session)
        self.performances = BaseRepository(ContentPerformance, session)

    # --- ContentIdea operations ---

    def add_idea(self, idea: ContentIdea) -> ContentIdea:
        return self.ideas.create(idea)

    def get_idea(self, idea_id: uuid.UUID) -> Optional[ContentIdea]:
        return self.ideas.get_by_id(idea_id)

    def list_ideas_by_brand(
        self, brand_profile_id: uuid.UUID, status: Optional[str] = None
    ) -> Sequence[ContentIdea]:
        stmt = select(ContentIdea).where(
            and_(
                ContentIdea.brand_profile_id == brand_profile_id,
                ContentIdea.deleted_at.is_(None),
            )
        )
        if status:
            stmt = stmt.where(ContentIdea.status == status)
        return self.session.execute(stmt).scalars().all()

    def update_idea(self, idea_id: uuid.UUID, **kwargs: object) -> Optional[ContentIdea]:
        return self.ideas.update(idea_id, **kwargs)

    # --- ContentAsset operations ---

    def add_asset(self, asset: ContentAsset) -> ContentAsset:
        return self.assets.create(asset)

    def get_assets_by_idea(self, content_idea_id: uuid.UUID) -> Sequence[ContentAsset]:
        stmt = select(ContentAsset).where(
            and_(
                ContentAsset.content_idea_id == content_idea_id,
                ContentAsset.deleted_at.is_(None),
            )
        )
        return self.session.execute(stmt).scalars().all()

    def get_assets_by_platform(
        self, brand_profile_id: uuid.UUID, platform: str
    ) -> Sequence[ContentAsset]:
        """Get assets for a brand filtered by platform, via join on ContentIdea."""
        stmt = (
            select(ContentAsset)
            .join(ContentIdea, ContentAsset.content_idea_id == ContentIdea.id)
            .where(
                and_(
                    ContentIdea.brand_profile_id == brand_profile_id,
                    ContentAsset.platform == platform,
                    ContentAsset.deleted_at.is_(None),
                    ContentIdea.deleted_at.is_(None),
                )
            )
        )
        return self.session.execute(stmt).scalars().all()

    def update_asset(self, asset_id: uuid.UUID, **kwargs: object) -> Optional[ContentAsset]:
        return self.assets.update(asset_id, **kwargs)

    # --- ContentPerformance operations ---

    def add_performance(self, perf: ContentPerformance) -> ContentPerformance:
        return self.performances.create(perf)

    def get_performance(self, asset_id: uuid.UUID) -> Optional[ContentPerformance]:
        stmt = select(ContentPerformance).where(
            ContentPerformance.content_asset_id == asset_id
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_top_performing(
        self, brand_profile_id: uuid.UUID, metric: str = "engagement_rate", limit: int = 10
    ) -> Sequence[ContentPerformance]:
        """Get top performing content by a metric, for a brand."""
        if not hasattr(ContentPerformance, metric):
            metric = "engagement_rate"
        stmt = (
            select(ContentPerformance)
            .join(ContentAsset, ContentPerformance.content_asset_id == ContentAsset.id)
            .join(ContentIdea, ContentAsset.content_idea_id == ContentIdea.id)
            .where(ContentIdea.brand_profile_id == brand_profile_id)
            .order_by(getattr(ContentPerformance, metric).desc())
            .limit(limit)
        )
        return self.session.execute(stmt).scalars().all()

    # --- What worked / what didn't ---

    def get_what_worked(
        self, brand_profile_id: uuid.UUID, threshold: float = 0.05, limit: int = 20
    ) -> Sequence[ContentPerformance]:
        """Content with engagement_rate above threshold."""
        stmt = (
            select(ContentPerformance)
            .join(ContentAsset, ContentPerformance.content_asset_id == ContentAsset.id)
            .join(ContentIdea, ContentAsset.content_idea_id == ContentIdea.id)
            .where(
                and_(
                    ContentIdea.brand_profile_id == brand_profile_id,
                    ContentPerformance.engagement_rate >= threshold,
                )
            )
            .order_by(ContentPerformance.engagement_rate.desc())
            .limit(limit)
        )
        return self.session.execute(stmt).scalars().all()

    def get_what_didnt_work(
        self, brand_profile_id: uuid.UUID, threshold: float = 0.02, limit: int = 20
    ) -> Sequence[ContentPerformance]:
        """Content with engagement_rate below threshold."""
        stmt = (
            select(ContentPerformance)
            .join(ContentAsset, ContentPerformance.content_asset_id == ContentAsset.id)
            .join(ContentIdea, ContentAsset.content_idea_id == ContentIdea.id)
            .where(
                and_(
                    ContentIdea.brand_profile_id == brand_profile_id,
                    ContentPerformance.engagement_rate < threshold,
                )
            )
            .order_by(ContentPerformance.engagement_rate.asc())
            .limit(limit)
        )
        return self.session.execute(stmt).scalars().all()
