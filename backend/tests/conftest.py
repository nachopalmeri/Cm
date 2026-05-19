"""Pytest fixtures and configuration."""
import os
import uuid
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Ensure we're in local mode for tests
os.environ.setdefault("SQLITE_PATH", ":memory:")
if "DATABASE_URL" in os.environ:
    del os.environ["DATABASE_URL"]

from app.db.base import Base
from app.models import (
    BrandProfile, BrandMemoryEntry,
    ContentIdea, ContentAsset, ContentPerformance,
    AudienceInsight, ContextEntry,
    MemoryEmbedding, WorkflowRun, AgentTrace,
)

from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.schemas.brand import BrandProfile as BrandProfileSchema
from app.schemas.brief import WeeklyBrief


@pytest.fixture
def db_engine():
    """Create a fresh in-memory SQLite engine for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine) -> Session:
    """Create a fresh database session for each test."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def temp_db_file():
    """Create a temporary database file for file-based SQLite tests."""
    # Use a unique filename in the temp directory instead of mkstemp
    # to avoid file locking issues on Windows
    import time
    path = os.path.join(tempfile.gettempdir(), f"test_social_ai_{int(time.time()*1000)}.db")
    yield path
    # Cleanup - try multiple times for Windows file locking
    for _ in range(3):
        try:
            if os.path.exists(path):
                os.unlink(path)
            break
        except PermissionError:
            import time
            time.sleep(0.1)
        except FileNotFoundError:
            break


@pytest.fixture
def sample_brand_profile(db_session: Session) -> BrandProfile:
    """Create a sample brand profile for testing."""
    profile = BrandProfile(
        id=uuid.uuid4(),
        name="Test Brand",
        voice="Professional but friendly",
        tone="Conversational",
        personality="Helpful and knowledgeable",
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def client() -> TestClient:
    """FastAPI test client."""
    return TestClient(fastapi_app)


@pytest.fixture
def sample_brand_schema() -> BrandProfileSchema:
    """Minimal Pydantic BrandProfile for API tests."""
    return BrandProfileSchema(
        name="Test Brand",
        handle="@testbrand",
        voice="Professional but friendly",
        tone="Conversational",
        personality="Helpful and knowledgeable",
        style="Clear and concise",
        audience_description="Tech founders and builders",
        platforms=["x", "linkedin"],
    )


@pytest.fixture
def sample_brief_schema() -> WeeklyBrief:
    """Minimal Pydantic WeeklyBrief for API tests."""
    return WeeklyBrief(
        themes=["Building in public", "AI agent memory"],
        projects=["social-ai-os MVP"],
        learnings=["MockLLM is sufficient for v0"],
        objectives=["Validate workflow pipeline"],
        platform_focus=["x", "linkedin"],
    )
