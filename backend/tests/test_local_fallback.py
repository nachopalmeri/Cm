"""Tests for local fallback mode (SQLite without pgvector)."""
import os
import uuid
from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect

from app.memory.local_fallback import (
    init_local_db,
    get_local_db_path,
    is_local_mode,
    get_local_mode_status,
    DEFAULT_SQLITE_PATH,
)


class TestLocalModeDetection:
    """Test local mode detection functions."""

    def test_is_local_mode_without_database_url(self, monkeypatch):
        """Should return True when DATABASE_URL is not set."""
        monkeypatch.delenv("DATABASE_URL", raising=False)
        assert is_local_mode() is True

    def test_is_local_mode_with_postgres_url(self, monkeypatch):
        """Should return False when DATABASE_URL is a Postgres URL."""
        import importlib
        monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
        # Reload to pick up new env var
        import app.db.engine as engine_module
        importlib.reload(engine_module)
        from app.memory.local_fallback import is_local_mode as is_local_mode_reloaded
        assert is_local_mode_reloaded() is False
        # Cleanup: reload back to local mode for other tests
        monkeypatch.delenv("DATABASE_URL", raising=False)
        importlib.reload(engine_module)

    def test_get_local_db_path_default(self, monkeypatch):
        """Should return default path when SQLITE_PATH not set."""
        monkeypatch.delenv("SQLITE_PATH", raising=False)
        assert get_local_db_path() == DEFAULT_SQLITE_PATH

    def test_get_local_db_path_custom(self, monkeypatch):
        """Should return custom path when SQLITE_PATH is set."""
        custom_path = "/tmp/test_social_ai.db"
        monkeypatch.setenv("SQLITE_PATH", custom_path)
        assert get_local_db_path() == custom_path


class TestLocalModeStatus:
    """Test local mode status reporting."""

    def test_local_mode_status_without_db(self, monkeypatch):
        """Should report correct status when DB doesn't exist."""
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.setenv("SQLITE_PATH", "/nonexistent/path/test.db")
        
        status = get_local_mode_status()
        
        assert status["mode"] == "local"
        assert status["db_path"] == "/nonexistent/path/test.db"
        assert status["db_exists"] is False
        assert status["pgvector_available"] is False
        assert status["semantic_search_available"] is False
        assert status["embedding_generation_available"] is False
        assert status["text_search_available"] is True
        assert len(status["limitations"]) > 0


class TestInitLocalDb:
    """Test database initialization in local mode."""

    def test_init_local_db_creates_file(self, temp_db_file, monkeypatch):
        """Should create database file if it doesn't exist."""
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.setenv("SQLITE_PATH", temp_db_file)
        
        # Ensure file doesn't exist
        Path(temp_db_file).unlink(missing_ok=True)
        
        result = init_local_db()
        
        assert result == temp_db_file
        assert Path(temp_db_file).exists()
        
    def test_init_local_db_skips_if_exists(self, temp_db_file, monkeypatch):
        """Should not fail if database already exists."""
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.setenv("SQLITE_PATH", temp_db_file)
        
        # Create the file first
        Path(temp_db_file).touch()
        
        result = init_local_db()
        
        assert result == temp_db_file

    def test_init_local_db_creates_tables(self, temp_db_file, monkeypatch):
        """Should create all required tables."""
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.setenv("SQLITE_PATH", temp_db_file)
        
        # Remove file if exists
        Path(temp_db_file).unlink(missing_ok=True)
        
        init_local_db()
        
        # Verify tables exist
        engine = create_engine(f"sqlite:///{temp_db_file}")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = [
            "brand_profiles",
            "brand_memory_entries",
            "content_ideas",
            "content_assets",
            "content_performances",
            "audience_insights",
            "context_entries",
            "memory_embeddings",
            "workflow_runs",
            "agent_traces",
        ]
        
        for table in expected_tables:
            assert table in tables, f"Table {table} should exist"

    def test_init_local_db_skips_if_postgres(self, monkeypatch):
        """Should skip initialization if Postgres is configured."""
        import importlib
        monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
        # Reload to pick up new env var
        import app.db.engine as engine_module
        importlib.reload(engine_module)
        # Also reload local_fallback which imports from engine
        import app.memory.local_fallback as fallback_module
        importlib.reload(fallback_module)
        
        result = fallback_module.init_local_db()
        
        assert result == ""
        # Cleanup
        monkeypatch.delenv("DATABASE_URL", raising=False)
        importlib.reload(engine_module)
        importlib.reload(fallback_module)
