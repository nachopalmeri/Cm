import logging
import os
from typing import Optional

import openai

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, embedding_model: str = "text-embedding-3-small"):
        self.embedding_model = embedding_model
        api_key = os.getenv("OPENAI_API_KEY", "")
        self._client: Optional[openai.AsyncOpenAI] = None
        if api_key:
            self._client = openai.AsyncOpenAI(api_key=api_key)

    @property
    def available(self) -> bool:
        return self._client is not None

    async def generate_embedding(self, text: str) -> Optional[list[float]]:
        if not self.available:
            return None
        try:
            response = await self._client.embeddings.create(
                model=self.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception:
            logger.exception("Embedding generation failed")
            return None

    async def generate_embeddings_batch(self, texts: list[str]) -> list[Optional[list[float]]]:
        if not self.available:
            return [None] * len(texts)
        try:
            response = await self._client.embeddings.create(
                model=self.embedding_model,
                input=texts,
            )
            results: list[Optional[list[float]]] = [None] * len(texts)
            for data in response.data:
                results[data.index] = data.embedding
            return results
        except Exception:
            logger.exception("Batch embedding generation failed")
            return [None] * len(texts)

    def get_dimension(self) -> int:
        dim_map = {
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072,
        }
        return dim_map.get(self.embedding_model, 1536)
