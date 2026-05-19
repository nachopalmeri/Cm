"""Embedding service — generates and manages vector embeddings.

This is a stub that delegates to an LLM provider for actual embedding generation.
In production, this calls OpenAI/Anthropic embedding APIs.
In local mode, embeddings are skipped (no vector search available).
"""
import logging
from typing import Optional

from app.db.engine import is_postgres

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and managing embeddings."""

    def __init__(self, embedding_model: str = "text-embedding-ada-002"):
        self.embedding_model = embedding_model
        self._available = is_postgres()

    @property
    def available(self) -> bool:
        """Whether embedding generation is available (requires Postgres + provider)."""
        return self._available and self._provider_configured()

    def _provider_configured(self) -> bool:
        """Check if an embedding provider API key is configured."""
        import os
        return bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))

    async def generate_embedding(self, text: str) -> Optional[list[float]]:
        """Generate an embedding for the given text.

        Returns None if embeddings are not available (local mode or no API key).
        """
        if not self.available:
            logger.debug("Embeddings not available — skipping generation")
            return None

        # TODO: Implement actual API call to embedding provider
        # This is a stub — the real implementation will call:
        # - OpenAI: client.embeddings.create(model=self.embedding_model, input=text)
        # - Or Anthropic/Voyage equivalent
        logger.info(f"Embedding generation stub called for text length={len(text)}")
        return None

    async def generate_embeddings_batch(self, texts: list[str]) -> list[Optional[list[float]]]:
        """Generate embeddings for multiple texts."""
        if not self.available:
            return [None] * len(texts)

        # TODO: Batch API call
        return [await self.generate_embedding(t) for t in texts]

    def get_dimension(self) -> int:
        """Return the dimension of the embedding vectors."""
        dim_map = {
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072,
        }
        return dim_map.get(self.embedding_model, 1536)
