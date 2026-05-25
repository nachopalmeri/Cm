"""Audience memory repository — insights by segment."""
import uuid
from typing import Optional, Sequence
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.audience import AudienceInsight
from app.memory.base_repo import BaseRepository


class AudienceMemoryRepository:
    """High-level repository for Audience Memory operations."""

    def __init__(self, session: Session):
        self.session = session
        self.insights = BaseRepository(AudienceInsight, session)

    def add_insight(self, insight: AudienceInsight) -> AudienceInsight:
        return self.insights.create(insight)

    def get_insights_by_brand(
        self,
        brand_profile_id: uuid.UUID,
        segment: Optional[str] = None,
        insight_type: Optional[str] = None,
    ) -> Sequence[AudienceInsight]:
        stmt = select(AudienceInsight).where(
            and_(
                AudienceInsight.brand_profile_id == brand_profile_id,
                AudienceInsight.deleted_at.is_(None),
            )
        )
        if segment:
            stmt = stmt.where(AudienceInsight.segment == segment)
        if insight_type:
            stmt = stmt.where(AudienceInsight.insight_type == insight_type)
        return self.session.execute(stmt).scalars().all()

    def get_best_times(self, brand_profile_id: uuid.UUID) -> Sequence[AudienceInsight]:
        return self.get_insights_by_brand(brand_profile_id, insight_type="best_time")

    def get_best_formats(self, brand_profile_id: uuid.UUID) -> Sequence[AudienceInsight]:
        return self.get_insights_by_brand(brand_profile_id, insight_type="best_format")

    def get_top_hooks(self, brand_profile_id: uuid.UUID) -> Sequence[AudienceInsight]:
        return self.get_insights_by_brand(brand_profile_id, insight_type="top_hook")

    def get_top_topics(self, brand_profile_id: uuid.UUID) -> Sequence[AudienceInsight]:
        return self.get_insights_by_brand(brand_profile_id, insight_type="top_topic")

    def update_insight(self, insight_id: uuid.UUID, **kwargs: object) -> Optional[AudienceInsight]:
        return self.insights.update(insight_id, **kwargs)

    def delete_insight(self, insight_id: uuid.UUID) -> bool:
        return self.insights.soft_delete(insight_id)
