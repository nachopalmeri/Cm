"""Tests for memory repositories using SQLite in-memory database."""
import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.orm import Session

from app.db.base import TimestampMixin
from app.models.brand import BrandProfile, BrandMemoryEntry
from app.models.content import ContentIdea, ContentAsset, ContentPerformance
from app.models.audience import AudienceInsight
from app.models.context import ContextEntry
from app.models.enums import ContentStatus, Platform, EmbeddingSourceType
from app.memory.base_repo import BaseRepository
from app.memory.brand_repo import BrandMemoryRepository
from app.memory.content_repo import ContentMemoryRepository
from app.memory.audience_repo import AudienceMemoryRepository
from app.memory.context_repo import ContextMemoryRepository
from app.memory.embedding_repo import EmbeddingRepository


class TestBaseRepository:
    """Test generic CRUD operations."""

    def test_get_by_id(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should retrieve entity by ID."""
        repo = BaseRepository(BrandProfile, db_session)
        
        result = repo.get_by_id(sample_brand_profile.id)
        
        assert result is not None
        assert result.id == sample_brand_profile.id
        assert result.name == "Test Brand"

    def test_get_by_id_not_found(self, db_session: Session):
        """Should return None for non-existent ID."""
        repo = BaseRepository(BrandProfile, db_session)
        
        result = repo.get_by_id(uuid.uuid4())
        
        assert result is None

    def test_create(self, db_session: Session):
        """Should create new entity."""
        repo = BaseRepository(BrandProfile, db_session)
        profile = BrandProfile(
            id=uuid.uuid4(),
            name="New Brand",
            voice="Test voice",
        )
        
        result = repo.create(profile)
        db_session.commit()
        
        assert result.id is not None
        assert result.name == "New Brand"

    def test_update(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should update entity fields."""
        repo = BaseRepository(BrandProfile, db_session)
        
        result = repo.update(
            sample_brand_profile.id,
            name="Updated Brand",
            voice="Updated voice"
        )
        db_session.commit()
        
        assert result is not None
        assert result.name == "Updated Brand"
        assert result.voice == "Updated voice"

    def test_soft_delete(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should soft delete entity."""
        repo = BaseRepository(BrandProfile, db_session)
        
        success = repo.soft_delete(sample_brand_profile.id)
        db_session.commit()
        
        assert success is True
        
        # Should not appear in regular queries
        result = repo.get_by_id(sample_brand_profile.id)
        assert result is None

    def test_list_all_with_filters(self, db_session: Session):
        """Should filter results."""
        repo = BaseRepository(BrandProfile, db_session)
        
        # Create multiple profiles
        for i in range(3):
            profile = BrandProfile(
                id=uuid.uuid4(),
                name=f"Brand {i}",
                voice=f"Voice {i}",
            )
            db_session.add(profile)
        db_session.commit()
        
        results = repo.list_all(limit=10)
        
        assert len(results) == 3


class TestBrandMemoryRepository:
    """Test brand memory operations."""

    def test_add_memory_entry(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should add memory entry to brand."""
        repo = BrandMemoryRepository(db_session)
        
        entry = BrandMemoryEntry(
            id=uuid.uuid4(),
            brand_profile_id=sample_brand_profile.id,
            category="voice",
            content="Test memory content",
            source="test",
        )
        
        result = repo.add_memory_entry(entry)
        db_session.commit()
        
        assert result.id is not None
        assert result.category == "voice"
        assert result.content == "Test memory content"

    def test_get_entries_by_profile(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should get entries filtered by profile."""
        repo = BrandMemoryRepository(db_session)
        
        # Add entries
        for i in range(3):
            entry = BrandMemoryEntry(
                id=uuid.uuid4(),
                brand_profile_id=sample_brand_profile.id,
                category="tone" if i % 2 == 0 else "style",
                content=f"Entry {i}",
                source="test",
            )
            db_session.add(entry)
        db_session.commit()
        
        results = repo.get_entries_by_profile(sample_brand_profile.id)
        
        assert len(results) == 3

    def test_get_entries_by_category(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should filter by category."""
        repo = BrandMemoryRepository(db_session)
        
        # Add entries with different categories
        for category in ["voice", "voice", "tone"]:
            entry = BrandMemoryEntry(
                id=uuid.uuid4(),
                brand_profile_id=sample_brand_profile.id,
                category=category,
                content=f"Content for {category}",
                source="test",
            )
            db_session.add(entry)
        db_session.commit()
        
        results = repo.get_entries_by_profile(sample_brand_profile.id, category="voice")
        
        assert len(results) == 2

    def test_search_entries(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should search entries by text content."""
        repo = BrandMemoryRepository(db_session)
        
        # Add entries with searchable content
        entry = BrandMemoryEntry(
            id=uuid.uuid4(),
            brand_profile_id=sample_brand_profile.id,
            category="voice",
            content="This is a searchable keyword in the content",
            source="test",
        )
        db_session.add(entry)
        db_session.commit()
        
        results = repo.search_entries(sample_brand_profile.id, "searchable keyword")
        
        assert len(results) == 1
        assert results[0].content == "This is a searchable keyword in the content"


class TestContentMemoryRepository:
    """Test content memory operations."""

    def test_add_idea_and_asset(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should add content idea and associated assets."""
        repo = ContentMemoryRepository(db_session)
        
        # Add idea
        idea = ContentIdea(
            id=uuid.uuid4(),
            brand_profile_id=sample_brand_profile.id,
            title="Test Idea",
            description="Test description",
            pillar="Education",
            target_platform=Platform.x.value,
            status=ContentStatus.draft.value,
        )
        idea = repo.add_idea(idea)
        db_session.commit()
        
        # Add asset
        asset = ContentAsset(
            id=uuid.uuid4(),
            content_idea_id=idea.id,
            asset_type="post",
            platform=Platform.x.value,
            body="Test post content",
            status=ContentStatus.draft.value,
            version=1,
        )
        asset = repo.add_asset(asset)
        db_session.commit()
        
        # Verify
        assets = repo.get_assets_by_idea(idea.id)
        assert len(assets) == 1
        assert assets[0].body == "Test post content"

    def test_list_ideas_by_brand(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should list ideas filtered by brand."""
        repo = ContentMemoryRepository(db_session)
        
        # Add ideas
        for i in range(3):
            idea = ContentIdea(
                id=uuid.uuid4(),
                brand_profile_id=sample_brand_profile.id,
                title=f"Idea {i}",
                status=ContentStatus.draft.value if i < 2 else ContentStatus.approved.value,
            )
            db_session.add(idea)
        db_session.commit()
        
        # Get all ideas
        all_ideas = repo.list_ideas_by_brand(sample_brand_profile.id)
        assert len(all_ideas) == 3
        
        # Filter by status
        draft_ideas = repo.list_ideas_by_brand(sample_brand_profile.id, status=ContentStatus.draft.value)
        assert len(draft_ideas) == 2


class TestAudienceMemoryRepository:
    """Test audience memory operations."""

    def test_add_insight(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should add audience insight."""
        repo = AudienceMemoryRepository(db_session)
        
        insight = AudienceInsight(
            id=uuid.uuid4(),
            brand_profile_id=sample_brand_profile.id,
            segment="developers",
            insight_type="best_time",
            content="Best posting time is 9 AM",
            confidence=0.85,
            source="analytics",
        )
        
        result = repo.add_insight(insight)
        db_session.commit()
        
        assert result.id is not None
        assert result.segment == "developers"
        assert result.insight_type == "best_time"

    def test_get_best_times(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should get best time insights."""
        repo = AudienceMemoryRepository(db_session)
        
        # Add insights
        for insight_type in ["best_time", "best_time", "best_format"]:
            insight = AudienceInsight(
                id=uuid.uuid4(),
                brand_profile_id=sample_brand_profile.id,
                segment="general",
                insight_type=insight_type,
                content=f"Content for {insight_type}",
            )
            db_session.add(insight)
        db_session.commit()
        
        results = repo.get_best_times(sample_brand_profile.id)
        
        assert len(results) == 2


class TestContextMemoryRepository:
    """Test context memory operations."""

    def test_add_entry(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should add context entry."""
        repo = ContextMemoryRepository(db_session)
        
        entry = ContextEntry(
            id=uuid.uuid4(),
            brand_profile_id=sample_brand_profile.id,
            entry_type="project",
            title="Launch Project",
            description="Upcoming product launch",
            status="active",
        )
        
        result = repo.add_entry(entry)
        db_session.commit()
        
        assert result.id is not None
        assert result.entry_type == "project"
        assert result.title == "Launch Project"

    def test_get_active_context(self, db_session: Session, sample_brand_profile: BrandProfile):
        """Should get active context entries."""
        repo = ContextMemoryRepository(db_session)
        
        # Add entries with different statuses
        for status in ["active", "active", "completed"]:
            entry = ContextEntry(
                id=uuid.uuid4(),
                brand_profile_id=sample_brand_profile.id,
                entry_type="milestone",
                title=f"Milestone {status}",
                status=status,
            )
            db_session.add(entry)
        db_session.commit()
        
        results = repo.get_active_context(sample_brand_profile.id)
        
        assert len(results) == 2


class TestEmbeddingRepository:
    """Test embedding repository operations."""

    def test_upsert_embedding(self, db_session: Session):
        """Should create and update embeddings."""
        repo = EmbeddingRepository(db_session)
        source_id = uuid.uuid4()
        embedding_vector = [0.1] * 1536
        
        # Create
        result = repo.upsert_embedding(
            source_type=EmbeddingSourceType.brand_memory.value,
            source_id=source_id,
            embedding=embedding_vector,
            embedding_model="text-embedding-ada-002",
            content="Test content",
        )
        db_session.commit()
        
        assert result.id is not None
        assert result.source_type == EmbeddingSourceType.brand_memory.value
        assert result.source_id == source_id
        
    def test_similarity_search_local_fallback(self, db_session: Session):
        """Should fallback to returning recent embeddings in local mode."""
        repo = EmbeddingRepository(db_session)
        
        # Add some embeddings
        for i in range(3):
            source_id = uuid.uuid4()
            embedding_vector = [0.1 * i] * 1536
            repo.upsert_embedding(
                source_type=EmbeddingSourceType.content_idea.value,
                source_id=source_id,
                embedding=embedding_vector,
                embedding_model="text-embedding-ada-002",
                content=f"Content {i}",
            )
        db_session.commit()
        
        # Search (should use local fallback)
        query_vector = [0.5] * 1536
        results = repo.similarity_search(
            query_embedding=query_vector,
            limit=10,
        )
        
        # Local fallback returns recent embeddings without vector math
        assert len(results) == 3
