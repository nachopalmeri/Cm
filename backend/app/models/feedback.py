import uuid
from typing import Optional
from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin


class FeedbackEntry(Base, TimestampMixin):
    __tablename__ = "feedback_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_profile_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False
    )
    draft_id: Mapped[str] = mapped_column(String(255), nullable=False)
    draft_text: Mapped[str] = mapped_column(Text, nullable=False)
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False)
    correction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    replaced_phrases: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_topics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    structural_diff: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    word_count_draft: Mapped[Optional[int]] = mapped_column(nullable=True)
    word_count_correction: Mapped[Optional[int]] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<FeedbackEntry {self.draft_id} approved={self.approved}>"
