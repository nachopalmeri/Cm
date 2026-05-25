"""Local fallback mode — SQLite without pgvector.

When no DATABASE_URL is configured, the memory layer operates in local mode:

1. **Storage**: SQLite file (`social_ai_os_local.db` by default, or SQLITE_PATH env var)
2. **Embeddings**: Skipped — no vector generation or similarity search
3. **Search**: Text-based only (ILIKE / LIKE patterns)
4. **Migrations**: Run with Alembic against SQLite (pgvector operations are no-ops)

This module provides helpers for local mode setup and validation.
"""
import os
import logging
from pathlib import Path

from app.db.engine import is_postgres

logger = logging.getLogger(__name__)

DEFAULT_SQLITE_PATH = "social_ai_os_local.db"


def is_local_mode() -> bool:
    """Check if the system is running in local mode."""
    return not is_postgres()


def get_local_db_path() -> str:
    """Get the path for the local SQLite database."""
    return os.getenv("SQLITE_PATH", DEFAULT_SQLITE_PATH)


def init_local_db() -> str:
    """Initialize the local SQLite database.

    Creates the DB file and runs migrations if needed.
    Returns the path to the database file.
    """
    if is_postgres():
        logger.warning("init_local_db called but Postgres is configured — skipping")
        return ""

    db_path = get_local_db_path()
    db_file = Path(db_path)

    if not db_file.exists():
        logger.info(f"Creating local SQLite database at {db_path}")
        # The actual table creation happens via Alembic migration
        # or via Base.metadata.create_all(engine) as a quick-start
        from app.db.engine import create_engine
        from app.db.base import Base
        from app.models import (  # noqa: F401
            BrandProfile, BrandMemoryEntry,
            ContentIdea, ContentAsset, ContentPerformance,
            AudienceInsight, ContextEntry,
            MemoryEmbedding, WorkflowRun, AgentTrace,
        )
        engine = create_engine()
        Base.metadata.create_all(bind=engine)
        logger.info(f"Local database initialized at {db_path}")
    else:
        logger.info(f"Local database already exists at {db_path}")

    return db_path


def get_local_mode_status() -> dict:
    """Return detailed status of local mode."""
    local = is_local_mode()
    db_path = get_local_db_path() if local else None
    db_exists = Path(db_path).exists() if db_path else False

    return {
        "mode": "local" if local else "postgres",
        "db_path": db_path,
        "db_exists": db_exists,
        "pgvector_available": not local,
        "semantic_search_available": False,
        "embedding_generation_available": False,
        "text_search_available": True,
        "limitations": [
            "No vector similarity search",
            "No embedding generation",
            "Text search uses LIKE patterns (slower, less accurate)",
            "JSONB columns stored as JSON text",
            "No concurrent write support (SQLite single-writer)",
        ] if local else [],
    }
