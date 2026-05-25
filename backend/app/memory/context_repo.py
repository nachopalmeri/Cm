"""Context memory repository — personal/professional context timeline."""
import uuid
import datetime
from typing import Optional, Sequence
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.context import ContextEntry
from app.memory.base_repo import BaseRepository


class ContextMemoryRepository:
    """High-level repository for Context Memory operations."""

    def __init__(self, session: Session):
        self.session = session
        self.entries = BaseRepository(ContextEntry, session)

    def add_entry(self, entry: ContextEntry) -> ContextEntry:
        return self.entries.create(entry)

    def get_entries_by_brand(
        self,
        brand_profile_id: uuid.UUID,
        entry_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Sequence[ContextEntry]:
        stmt = select(ContextEntry).where(
            and_(
                ContextEntry.brand_profile_id == brand_profile_id,
                ContextEntry.deleted_at.is_(None),
            )
        )
        if entry_type:
            stmt = stmt.where(ContextEntry.entry_type == entry_type)
        if status:
            stmt = stmt.where(ContextEntry.status == status)
        return self.session.execute(stmt).scalars().all()

    def get_active_context(self, brand_profile_id: uuid.UUID) -> Sequence[ContextEntry]:
        """Get currently active context entries (status='active' or within relevance dates)."""
        today = datetime.date.today()
        stmt = select(ContextEntry).where(
            and_(
                ContextEntry.brand_profile_id == brand_profile_id,
                ContextEntry.deleted_at.is_(None),
                ContextEntry.status == "active",
            )
        )
        return self.session.execute(stmt).scalars().all()

    def get_upcoming_context(self, brand_profile_id: uuid.UUID) -> Sequence[ContextEntry]:
        """Get upcoming context entries."""
        stmt = select(ContextEntry).where(
            and_(
                ContextEntry.brand_profile_id == brand_profile_id,
                ContextEntry.deleted_at.is_(None),
                ContextEntry.status == "upcoming",
            )
        )
        return self.session.execute(stmt).scalars().all()

    def update_entry(self, entry_id: uuid.UUID, **kwargs: object) -> Optional[ContextEntry]:
        return self.entries.update(entry_id, **kwargs)

    def delete_entry(self, entry_id: uuid.UUID) -> bool:
        return self.entries.soft_delete(entry_id)
