"""pgvector integration for SQLAlchemy.

Provides a Vector column type that works with pgvector in Postgres
and falls back to a JSON blob in SQLite (local mode).

Also provides JSONBCompat: JSONB on Postgres, JSON on SQLite.
"""
import json
from sqlalchemy import Float, String, Text, JSON, types
from sqlalchemy.engine import Dialect
from typing import Any


class Vector(types.TypeDecorator):
    """SQLAlchemy type for pgvector vector columns.

    In Postgres: uses the 'vector' type from pgvector extension.
    In SQLite: stores as JSON array of floats.
    """

    impl = Text()
    cache_ok = True

    def __init__(self, dim: int = 1536, *args: Any, **kwargs: Any):
        self.dim = dim
        super().__init__(*args, **kwargs)

    def process_bind_param(self, value: Any, dialect: Dialect) -> Any:
        if value is None:
            return None
        if dialect.name == "postgresql":
            # pgvector expects a string like "[0.1, 0.2, ...]"
            if isinstance(value, list):
                return "[" + ",".join(str(float(v)) for v in value) + "]"
            return str(value)
        else:
            # SQLite: store as JSON string
            return json.dumps([float(v) for v in value])

    def process_result_value(self, value: Any, dialect: Dialect) -> Any:
        if value is None:
            return None
        if dialect.name == "postgresql":
            # pgvector returns string like "[0.1,0.2]"
            if isinstance(value, str):
                value = value.strip("[]")
                return [float(v) for v in value.split(",") if v.strip()]
            return value
        else:
            # SQLite: stored as JSON
            return json.loads(value)

    def get_col_spec(self, **kw: Any) -> str:
        return f"VECTOR({self.dim})"


class JSONBCompat(types.TypeDecorator):
    """SQLAlchemy type for JSONB columns.

    In Postgres: uses native JSONB.
    In SQLite: falls back to JSON (which SQLite supports natively).
    """

    impl = JSON()
    cache_ok = True

    def load_dialect_impl(self, dialect: Dialect) -> Any:
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
            return dialect.type_descriptor(PG_JSONB)
        else:
            return dialect.type_descriptor(JSON())
