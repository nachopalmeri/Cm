"""Memory package — factory functions and public API.

Detects Postgres vs local mode and provides the appropriate memory service.
"""
from sqlalchemy.orm import Session
from app.memory.memory_service import MemoryService
from app.memory.embedding_service import EmbeddingService
from app.memory.brand_repo import BrandMemoryRepository
from app.memory.content_repo import ContentMemoryRepository
from app.memory.audience_repo import AudienceMemoryRepository
from app.memory.context_repo import ContextMemoryRepository
from app.memory.embedding_repo import EmbeddingRepository
from app.memory.base_repo import BaseRepository
from app.db.engine import is_postgres


def create_memory_service(session: Session) -> MemoryService:
    """Factory: create a MemoryService with the appropriate mode.

    In Postgres mode: full pgvector support, semantic search.
    In local mode: SQLite, text search only, no embeddings.
    """
    return MemoryService(session=session)


def get_mode_info() -> dict:
    """Return info about the current memory mode."""
    postgres = is_postgres()
    return {
        "mode": "postgres" if postgres else "local",
        "pgvector": postgres,
        "semantic_search": postgres,
        "embedding_available": postgres and bool(
            __import__("os").getenv("OPENAI_API_KEY") or __import__("os").getenv("ANTHROPIC_API_KEY")
        ),
    }


__all__ = [
    "MemoryService",
    "EmbeddingService",
    "BrandMemoryRepository",
    "ContentMemoryRepository",
    "AudienceMemoryRepository",
    "ContextMemoryRepository",
    "EmbeddingRepository",
    "BaseRepository",
    "create_memory_service",
    "get_mode_info",
]
