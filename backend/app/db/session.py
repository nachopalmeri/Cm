from typing import Generator
from sqlalchemy.orm import Session, sessionmaker
from app.db.engine import create_engine

_engine = None
_SessionLocal = None


def _get_or_create_session_local() -> sessionmaker:
    global _engine, _SessionLocal
    if _SessionLocal is None:
        _engine = create_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _SessionLocal


def get_session() -> Generator[Session, None, None]:
    session_local = _get_or_create_session_local()
    db = session_local()
    try:
        yield db
    finally:
        db.close()


# Convenience alias for direct usage
SessionLocal = _get_or_create_session_local
