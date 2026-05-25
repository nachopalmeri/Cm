"""Embedding repository — upsert + similarity search with pgvector."""
import uuid
import hashlib
from typing import Optional, Sequence
from sqlalchemy import select, and_, text
from sqlalchemy.orm import Session
from app.db.engine import is_postgres
from app.models.embedding import MemoryEmbedding
from app.models.enums import EmbeddingSourceType
from app.memory.base_repo import BaseRepository


class EmbeddingRepository:
    """Repository for vector embeddings with pgvector similarity search."""

    def __init__(self, session: Session):
        self.session = session
        self.repo = BaseRepository(MemoryEmbedding, session)

    def upsert_embedding(
        self,
        source_type: str,
        source_id: uuid.UUID,
        embedding: list[float],
        embedding_model: str = "text-embedding-ada-002",
        content: Optional[str] = None,
    ) -> MemoryEmbedding:
        """Insert or update an embedding for a source entity."""
        content_hash = hashlib.sha256(content.encode()).hexdigest() if content else None

        # Check if embedding already exists
        existing = self._get_by_source(source_type, source_id)
        if existing:
            existing.embedding = embedding
            existing.embedding_model = embedding_model
            existing.content_hash = content_hash
            self.session.flush()
            return existing

        emb = MemoryEmbedding(
            source_type=source_type,
            source_id=source_id,
            embedding=embedding,
            embedding_model=embedding_model,
            content_hash=content_hash,
        )
        return self.repo.create(emb)

    def _get_by_source(self, source_type: str, source_id: uuid.UUID) -> Optional[MemoryEmbedding]:
        stmt = select(MemoryEmbedding).where(
            and_(
                MemoryEmbedding.source_type == source_type,
                MemoryEmbedding.source_id == source_id,
            )
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def similarity_search(
        self,
        query_embedding: list[float],
        source_type: Optional[str] = None,
        limit: int = 10,
        threshold: float = 0.7,
    ) -> Sequence[MemoryEmbedding]:
        """Find similar embeddings using cosine distance.

        In Postgres: uses pgvector <=> operator.
        In SQLite: falls back to returning all embeddings (no vector search).
        """
        if is_postgres():
            return self._pgvector_search(query_embedding, source_type, limit, threshold)
        else:
            return self._local_search(query_embedding, source_type, limit)

    def _pgvector_search(
        self,
        query_embedding: list[float],
        source_type: Optional[str],
        limit: int,
        threshold: float,
    ) -> Sequence[MemoryEmbedding]:
        query_str = "[" + ",".join(str(float(v)) for v in query_embedding) + "]"
        stmt = select(MemoryEmbedding).where(
            MemoryEmbedding.embedding.isnot(None),
        )
        if source_type:
            stmt = stmt.where(MemoryEmbedding.source_type == source_type)

        # Cosine distance: 1 - similarity. Threshold 0.7 similarity = 0.3 distance
        distance_threshold = 1.0 - threshold
        stmt = stmt.where(
            text(f"embedding <=> '{query_str}' < {distance_threshold}")
        ).order_by(
            text(f"embedding <=> '{query_str}'")
        ).limit(limit)

        return self.session.execute(stmt).scalars().all()

    def _local_search(
        self,
        query_embedding: list[float],
        source_type: Optional[str],
        limit: int,
    ) -> Sequence[MemoryEmbedding]:
        """Local fallback: return recent embeddings, no vector search."""
        stmt = select(MemoryEmbedding)
        if source_type:
            stmt = stmt.where(MemoryEmbedding.source_type == source_type)
        stmt = stmt.order_by(MemoryEmbedding.created_at.desc()).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def delete_embedding(self, source_type: str, source_id: uuid.UUID) -> bool:
        existing = self._get_by_source(source_type, source_id)
        if existing is None:
            return False
        self.session.delete(existing)
        self.session.flush()
        return True

    def needs_reindex(self, source_type: str, source_id: uuid.UUID, content: str) -> bool:
        """Check if content has changed since last embedding."""
        existing = self._get_by_source(source_type, source_id)
        if existing is None:
            return True
        current_hash = hashlib.sha256(content.encode()).hexdigest()
        return existing.content_hash != current_hash
