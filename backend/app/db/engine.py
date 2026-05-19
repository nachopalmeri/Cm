import os
from sqlalchemy import create_engine as _sa_create_engine
from sqlalchemy.engine import Engine


DATABASE_URL = os.getenv("DATABASE_URL", "")


def is_postgres() -> bool:
    return DATABASE_URL.startswith("postgresql")


def create_engine_from_env() -> Engine:
    if is_postgres():
        connect_args = {}
        # Enable pgvector extension on first connection
        engine = _sa_create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
        _setup_pgvector(engine)
        return engine
    else:
        # Local / SQLite mode
        db_path = os.getenv("SQLITE_PATH", "social_ai_os_local.db")
        engine = _sa_create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
        return engine


def _setup_pgvector(engine: Engine) -> None:
    from sqlalchemy import text

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()


def create_engine() -> Engine:
    return create_engine_from_env()
