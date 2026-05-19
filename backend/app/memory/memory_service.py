"""Memory service — high-level API for storing, retrieving, and searching memories.

This is the main entry point for the memory layer. It coordinates between
repositories and the embedding service to provide a unified memory API.
"""
import uuid
import logging
from typing import Optional, Sequence

from sqlalchemy.orm import Session

from app.models.brand import BrandProfile, BrandMemoryEntry
from app.models.content import ContentIdea, ContentAsset, ContentPerformance
from app.models.audience import AudienceInsight
from app.models.context import ContextEntry
from app.models.enums import EmbeddingSourceType
from app.memory.brand_repo import BrandMemoryRepository
from app.memory.content_repo import ContentMemoryRepository
from app.memory.audience_repo import AudienceMemoryRepository
from app.memory.context_repo import ContextMemoryRepository
from app.memory.embedding_repo import EmbeddingRepository
from app.memory.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class MemoryService:
    """High-level memory service coordinating all memory operations."""

    def __init__(self, session: Session):
        self.session = session
        self.brand = BrandMemoryRepository(session)
        self.content = ContentMemoryRepository(session)
        self.audience = AudienceMemoryRepository(session)
        self.context = ContextMemoryRepository(session)
        self.embeddings = EmbeddingRepository(session)
        self._embedding_service = EmbeddingService()

    # --- Brand Memory ---

    async def store_brand_memory(
        self,
        brand_profile_id: uuid.UUID,
        category: str,
        content: str,
        source: str = "user_input",
        confidence: Optional[float] = None,
    ) -> BrandMemoryEntry:
        entry = BrandMemoryEntry(
            brand_profile_id=brand_profile_id,
            category=category,
            content=content,
            source=source,
            confidence=confidence,
        )
        entry = self.brand.add_memory_entry(entry)

        # Generate and store embedding if available
        embedding = await self._embedding_service.generate_embedding(content)
        if embedding:
            self.embeddings.upsert_embedding(
                source_type=EmbeddingSourceType.brand_memory.value,
                source_id=entry.id,
                embedding=embedding,
                embedding_model=self._embedding_service.embedding_model,
                content=content,
            )

        return entry

    async def search_brand_memory(
        self,
        brand_profile_id: uuid.UUID,
        query: str,
        limit: int = 10,
        use_semantic: bool = True,
    ) -> Sequence[BrandMemoryEntry]:
        """Search brand memory by text and optionally by semantic similarity."""
        # Text search first
        text_results = self.brand.search_entries(brand_profile_id, query, limit=limit)

        if use_semantic and self._embedding_service.available:
            query_embedding = await self._embedding_service.generate_embedding(query)
            if query_embedding:
                similar = self.embeddings.similarity_search(
                    query_embedding=query_embedding,
                    source_type=EmbeddingSourceType.brand_memory.value,
                    limit=limit,
                )
                # Merge results, deduplicating by ID
                seen = {e.id for e in text_results}
                for emb in similar:
                    if emb.brand_memory_entry and emb.brand_memory_entry.id not in seen:
                        text_results.append(emb.brand_memory_entry)
                        seen.add(emb.brand_memory_entry.id)
                return text_results[:limit]

        return text_results

    # --- Content Memory ---

    async def store_content_idea(
        self,
        brand_profile_id: uuid.UUID,
        title: str,
        description: Optional[str] = None,
        pillar: Optional[str] = None,
        target_platform: Optional[str] = None,
        source: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ) -> ContentIdea:
        idea = ContentIdea(
            brand_profile_id=brand_profile_id,
            title=title,
            description=description,
            pillar=pillar,
            target_platform=target_platform,
            source=source,
            metadata_json=metadata_json,
        )
        idea = self.content.add_idea(idea)

        # Embedding
        text_to_embed = f"{title}. {description or ''}"
        embedding = await self._embedding_service.generate_embedding(text_to_embed)
        if embedding:
            self.embeddings.upsert_embedding(
                source_type=EmbeddingSourceType.content_idea.value,
                source_id=idea.id,
                embedding=embedding,
                embedding_model=self._embedding_service.embedding_model,
                content=text_to_embed,
            )

        return idea

    async def store_content_asset(
        self,
        content_idea_id: uuid.UUID,
        asset_type: str,
        platform: str,
        body: str,
        hook: Optional[str] = None,
        cta: Optional[str] = None,
        hashtags: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ) -> ContentAsset:
        asset = ContentAsset(
            content_idea_id=content_idea_id,
            asset_type=asset_type,
            platform=platform,
            body=body,
            hook=hook,
            cta=cta,
            hashtags=hashtags,
            metadata_json=metadata_json,
        )
        return self.content.add_asset(asset)

    async def store_performance(
        self,
        content_asset_id: uuid.UUID,
        platform: str,
        **metrics: object,
    ) -> ContentPerformance:
        perf = ContentPerformance(
            content_asset_id=content_asset_id,
            platform=platform,
            **metrics,
        )
        return self.content.add_performance(perf)

    def get_content_history(
        self, brand_profile_id: uuid.UUID, status: Optional[str] = None
    ) -> Sequence[ContentIdea]:
        return self.content.list_ideas_by_brand(brand_profile_id, status=status)

    def get_what_worked(
        self, brand_profile_id: uuid.UUID, threshold: float = 0.05, limit: int = 20
    ) -> Sequence[ContentPerformance]:
        return self.content.get_what_worked(brand_profile_id, threshold, limit)

    def get_what_didnt_work(
        self, brand_profile_id: uuid.UUID, threshold: float = 0.02, limit: int = 20
    ) -> Sequence[ContentPerformance]:
        return self.content.get_what_didnt_work(brand_profile_id, threshold, limit)

    # --- Audience Memory ---

    async def store_audience_insight(
        self,
        brand_profile_id: uuid.UUID,
        segment: str,
        insight_type: str,
        content: str,
        source: Optional[str] = None,
        confidence: Optional[float] = None,
        metadata_json: Optional[dict] = None,
    ) -> AudienceInsight:
        insight = AudienceInsight(
            brand_profile_id=brand_profile_id,
            segment=segment,
            insight_type=insight_type,
            content=content,
            source=source,
            confidence=confidence,
            metadata_json=metadata_json,
        )
        insight = self.audience.add_insight(insight)

        # Embedding
        embedding = await self._embedding_service.generate_embedding(content)
        if embedding:
            self.embeddings.upsert_embedding(
                source_type=EmbeddingSourceType.audience_insight.value,
                source_id=insight.id,
                embedding=embedding,
                embedding_model=self._embedding_service.embedding_model,
                content=content,
            )

        return insight

    def get_audience_insights(
        self,
        brand_profile_id: uuid.UUID,
        segment: Optional[str] = None,
        insight_type: Optional[str] = None,
    ) -> Sequence[AudienceInsight]:
        return self.audience.get_insights_by_brand(
            brand_profile_id, segment=segment, insight_type=insight_type
        )

    # --- Context Memory ---

    async def store_context_entry(
        self,
        brand_profile_id: uuid.UUID,
        entry_type: str,
        title: str,
        description: Optional[str] = None,
        relevance_start: Optional[str] = None,
        relevance_end: Optional[str] = None,
        status: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ) -> ContextEntry:
        entry = ContextEntry(
            brand_profile_id=brand_profile_id,
            entry_type=entry_type,
            title=title,
            description=description,
            relevance_start=relevance_start,
            relevance_end=relevance_end,
            status=status,
            metadata_json=metadata_json,
        )
        entry = self.context.add_entry(entry)

        # Embedding
        text_to_embed = f"{title}. {description or ''}"
        embedding = await self._embedding_service.generate_embedding(text_to_embed)
        if embedding:
            self.embeddings.upsert_embedding(
                source_type=EmbeddingSourceType.context_entry.value,
                source_id=entry.id,
                embedding=embedding,
                embedding_model=self._embedding_service.embedding_model,
                content=text_to_embed,
            )

        return entry

    def get_active_context(self, brand_profile_id: uuid.UUID) -> Sequence[ContextEntry]:
        return self.context.get_active_context(brand_profile_id)

    def get_upcoming_context(self, brand_profile_id: uuid.UUID) -> Sequence[ContextEntry]:
        return self.context.get_upcoming_context(brand_profile_id)

    # --- Semantic search across all memory types ---

    async def search_all_memory(
        self,
        brand_profile_id: uuid.UUID,
        query: str,
        limit: int = 10,
    ) -> dict[str, Sequence]:
        """Search across all memory types (brand, content, audience, context)."""
        results: dict[str, Sequence] = {}

        # Text-based searches
        results["brand_memory"] = self.brand.search_entries(brand_profile_id, query, limit=limit)
        results["content_ideas"] = self.content.list_ideas_by_brand(brand_profile_id)
        results["audience_insights"] = self.audience.get_insights_by_brand(brand_profile_id)
        results["context_entries"] = self.context.get_active_context(brand_profile_id)

        # Semantic search if available
        if self._embedding_service.available:
            query_embedding = await self._embedding_service.generate_embedding(query)
            if query_embedding:
                results["semantic_matches"] = self.embeddings.similarity_search(
                    query_embedding=query_embedding,
                    limit=limit,
                )

        return results
