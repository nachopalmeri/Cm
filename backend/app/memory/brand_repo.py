"""Brand memory repository — brand profile + brand memory entries + semantic search."""
import uuid
from typing import Optional, Sequence
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.brand import BrandProfile, BrandMemoryEntry
from app.memory.base_repo import BaseRepository


class BrandMemoryRepository:
    """High-level repository for Brand Memory operations."""

    def __init__(self, session: Session):
        self.session = session
        self.profiles = BaseRepository(BrandProfile, session)
        self.entries = BaseRepository(BrandMemoryEntry, session)

    # --- BrandProfile operations ---

    def get_profile(self, profile_id: uuid.UUID) -> Optional[BrandProfile]:
        return self.profiles.get_by_id(profile_id)

    def list_profiles(self, offset: int = 0, limit: int = 100) -> Sequence[BrandProfile]:
        return self.profiles.list_all(offset=offset, limit=limit)

    def create_profile(self, profile: BrandProfile) -> BrandProfile:
        return self.profiles.create(profile)

    def update_profile(self, profile_id: uuid.UUID, **kwargs: object) -> Optional[BrandProfile]:
        return self.profiles.update(profile_id, **kwargs)

    # --- BrandMemoryEntry operations ---

    def add_memory_entry(self, entry: BrandMemoryEntry) -> BrandMemoryEntry:
        return self.entries.create(entry)

    def get_entries_by_profile(
        self, brand_profile_id: uuid.UUID, category: Optional[str] = None
    ) -> Sequence[BrandMemoryEntry]:
        stmt = select(BrandMemoryEntry).where(
            and_(
                BrandMemoryEntry.brand_profile_id == brand_profile_id,
                BrandMemoryEntry.deleted_at.is_(None),
            )
        )
        if category:
            stmt = stmt.where(BrandMemoryEntry.category == category)
        return self.session.execute(stmt).scalars().all()

    def get_entries_by_source(
        self, brand_profile_id: uuid.UUID, source: str
    ) -> Sequence[BrandMemoryEntry]:
        stmt = select(BrandMemoryEntry).where(
            and_(
                BrandMemoryEntry.brand_profile_id == brand_profile_id,
                BrandMemoryEntry.source == source,
                BrandMemoryEntry.deleted_at.is_(None),
            )
        )
        return self.session.execute(stmt).scalars().all()

    def search_entries(
        self, brand_profile_id: uuid.UUID, query: str, limit: int = 10
    ) -> Sequence[BrandMemoryEntry]:
        """Simple text search on content field. Semantic search via EmbeddingRepository."""
        stmt = select(BrandMemoryEntry).where(
            and_(
                BrandMemoryEntry.brand_profile_id == brand_profile_id,
                BrandMemoryEntry.content.ilike(f"%{query}%"),
                BrandMemoryEntry.deleted_at.is_(None),
            )
        ).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def update_entry(self, entry_id: uuid.UUID, **kwargs: object) -> Optional[BrandMemoryEntry]:
        return self.entries.update(entry_id, **kwargs)

    def delete_entry(self, entry_id: uuid.UUID) -> bool:
        return self.entries.soft_delete(entry_id)
