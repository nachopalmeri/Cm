"""GhostwriterService - AI ghostwriter with persistent brand memory."""
from __future__ import annotations

import re
import uuid
import logging

from sqlalchemy.orm import Session

from app.agents.llm import LLMProvider, MockLLM
from app.memory.memory_service import MemoryService
from app.models.brand import BrandProfile as BrandProfileModel
from app.prompts.registry import PromptRegistry
from app.schemas.api import (
    ContentDraft,
    DraftAnalysis,
    FeedbackResponse,
    GenerateResponse,
    IngestResponse,
    VoiceProfileResponse,
)
from app.schemas.brand import BrandProfile as BrandProfileSchema

logger = logging.getLogger(__name__)

_registry = PromptRegistry()


class GhostwriterService:
    """Coordinates ingest, profile, generate and feedback for the ghostwriter."""

    def __init__(self, session: Session, llm: LLMProvider | None = None) -> None:
        self._session = session
        self._memory = MemoryService(session)
        self._llm: LLMProvider = llm or MockLLM()

    # ------------------------------------------------------------------
    # 1. Ingest
    # ------------------------------------------------------------------

    async def ingest(
        self,
        texts: list[str],
        source: str,
        brand_profile: BrandProfileSchema,
    ) -> IngestResponse:
        """Store raw content samples as BrandMemoryEntries with embeddings."""
        brand_id = await self._get_or_create_brand_id(brand_profile)
        count = 0
        for text in texts:
            if not text.strip():
                continue
            await self._memory.store_brand_memory(
                brand_profile_id=brand_id,
                category="voice_sample",
                content=text.strip(),
                source=source,
            )
            count += 1

        return IngestResponse(ingested=count, voice_updated=count > 0)

    # ------------------------------------------------------------------
    # 2. Profile
    # ------------------------------------------------------------------

    async def get_profile(self, brand_profile_id: uuid.UUID) -> VoiceProfileResponse:
        """Build a VoiceProfileResponse from stored BrandMemoryEntries."""
        entries = self._memory.brand.get_entries_by_profile(brand_profile_id)

        voice_entries = [
            e for e in entries
            if e.category in ("voice_sample", "feedback_approved")
        ]

        topics = _extract_topics([e.content for e in voice_entries])
        tone = _infer_tone([e.content for e in voice_entries])
        style = _infer_style([e.content for e in voice_entries])
        examples = [e.content for e in voice_entries[:5] if e.content]

        return VoiceProfileResponse(
            brand_id=str(brand_profile_id),
            topics=topics,
            tone=tone,
            style=style,
            examples=examples,
            total_samples=len(voice_entries),
        )

    # ------------------------------------------------------------------
    # 3. Generate
    # ------------------------------------------------------------------

    async def generate(
        self,
        topic: str,
        platform: str,
        count: int,
        brand_profile: BrandProfileSchema,
    ) -> GenerateResponse:
        """Generate N content drafts using the brand voice profile.

        Enriches the prompt with:
        - Approved voice samples from BrandMemory
        - Feedback analysis (replaced_phrases, new_topics) from past corrections
        """
        brand_id = await self._get_or_create_brand_id(brand_profile)

        memory_results = await self._memory.search_all_memory(
            brand_profile_id=brand_id,
            query=topic,
            limit=10,
        )

        # Collect approved voice samples
        voice_samples: list[str] = []
        for item in memory_results.get("brand_memory", []):
            if hasattr(item, "content") and item.content:
                if hasattr(item, "category") and item.category in ("voice_sample", "feedback_approved"):
                    voice_samples.append(item.content)

        examples_text = (
            "\n\n".join(f"- {s}" for s in voice_samples[:3])
            if voice_samples
            else "(No examples yet - generating from voice profile.)"
        )

        # Build feedback constraints from accumulated feedback_analysis entries
        feedback_entries = self._memory.brand.get_entries_by_profile(brand_id)
        feedback_constraints = _build_feedback_constraints(
            [e for e in feedback_entries if e.category == "feedback_analysis"]
        )

        try:
            prompt = _registry.get_prompt("ghostwriter")
            system_base = prompt.system_prompt.format(
                name=brand_profile.name,
                voice=brand_profile.voice,
                tone=brand_profile.tone,
                style=brand_profile.style,
                platform=platform,
                topic=topic,
                count=str(count),
                examples=examples_text,
            )
            # Inject feedback constraints into system prompt
            system = system_base + feedback_constraints
            user = prompt.user_template.format(
                name=brand_profile.name,
                voice=brand_profile.voice,
                tone=brand_profile.tone,
                style=brand_profile.style,
                platform=platform,
                topic=topic,
                count=str(count),
                examples=examples_text,
            )
        except KeyError:
            logger.warning("ghostwriter prompt not found in registry, using fallback")
            system = (
                f"Sos el ghostwriter de {brand_profile.name}. "
                f"Voz: {brand_profile.voice}. Tono: {brand_profile.tone}. "
                f"Plataforma: {platform}."
            ) + feedback_constraints
            user = (
                f"Escribi {count} versiones sobre '{topic}' para {platform}. "
                "Separa cada una con ---DRAFT---."
            )

        response = await self._llm.generate(system=system, user=user)
        drafts = _parse_drafts(response.content, topic=topic, platform=platform, count=count)

        return GenerateResponse(options=drafts)

    # ------------------------------------------------------------------
    # 4. Feedback
    # ------------------------------------------------------------------

    async def feedback(
        self,
        draft_id: str,
        draft_text: str,
        approved: bool,
        correction: str | None,
        brand_profile_id: uuid.UUID,
    ) -> FeedbackResponse:
        """Store feedback and run structural analysis to enrich BrandMemory."""
        analysis = _analyse_feedback(
            draft_text=draft_text,
            correction=correction,
        )

        category = "feedback_approved" if approved else "feedback_rejected"
        content = correction if correction else draft_text

        analysis_summary = (
            f"draft_id={draft_id} | approved={approved} | "
            f"replaced={analysis.replaced_phrases} | "
            f"new_topics={analysis.new_topics_in_correction} | "
            f"struct_diff={analysis.structural_diff}"
        )

        try:
            await self._memory.store_brand_memory(
                brand_profile_id=brand_profile_id,
                category=category,
                content=content,
                source="ghostwriter_feedback",
            )
            await self._memory.store_brand_memory(
                brand_profile_id=brand_profile_id,
                category="feedback_analysis",
                content=analysis_summary,
                source="ghostwriter_feedback",
            )
            stored = True
            memory_updated = True
        except Exception:
            logger.exception("Failed to store feedback in BrandMemory")
            stored = False
            memory_updated = False

        return FeedbackResponse(
            stored=stored,
            memory_updated=memory_updated,
            analysis=analysis,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_or_create_brand_id(self, brand_profile: BrandProfileSchema) -> uuid.UUID:
        """Return an existing BrandProfile ID or create a new stub in the DB."""
        profiles = self._memory.brand.list_profiles(limit=1)
        if profiles:
            return profiles[0].id

        new_profile = BrandProfileModel(
            id=uuid.uuid4(),
            name=brand_profile.name,
            voice=brand_profile.voice,
            tone=brand_profile.tone,
            personality=brand_profile.personality,
            style=brand_profile.style,
        )
        self._memory.brand.create_profile(new_profile)
        return new_profile.id


# ---------------------------------------------------------------------------
# Pure analysis helpers (no DB, no LLM)
# ---------------------------------------------------------------------------

_TOPIC_KEYWORDS: list[str] = [
    "AI", "memory", "agents", "LLM", "product", "startup", "SaaS", "ship",
    "build", "content", "growth", "marketing", "brand", "voice", "writing",
    "code", "deploy", "MVP", "launch", "learn", "feedback", "data",
]


def _extract_topics(texts: list[str]) -> list[str]:
    """Count keyword occurrences across texts and return top topics."""
    counts: dict[str, int] = {}
    combined = " ".join(texts).lower()
    for kw in _TOPIC_KEYWORDS:
        n = combined.count(kw.lower())
        if n > 0:
            counts[kw] = n
    sorted_topics = sorted(counts, key=lambda k: counts[k], reverse=True)
    return sorted_topics[:8]


def _infer_tone(texts: list[str]) -> str:
    if not texts:
        return "unknown"
    combined = " ".join(texts).lower()
    if any(w in combined for w in ["!", "excited", "amazing", "love"]):
        return "enthusiastic"
    if any(w in combined for w in ["?", "wonder", "curious", "explore"]):
        return "curious"
    if any(w in combined for w in ["data", "evidence", "research", "study"]):
        return "analytical"
    return "conversational"


def _infer_style(texts: list[str]) -> str:
    if not texts:
        return "unknown"
    avg_len = sum(len(t.split()) for t in texts) / len(texts)
    if avg_len < 30:
        return "short-form, punchy"
    if avg_len < 80:
        return "medium-form, structured"
    return "long-form, detailed"


def _parse_drafts(
    raw: str,
    topic: str,
    platform: str,
    count: int,
) -> list[ContentDraft]:
    """Split LLM output on ---DRAFT--- separator into ContentDraft objects."""
    parts = re.split(r"-{3,}DRAFT-{3,}", raw, flags=re.IGNORECASE)
    drafts: list[ContentDraft] = []
    for part in parts:
        text = part.strip()
        if text:
            drafts.append(ContentDraft(text=text, platform=platform, topic=topic))
        if len(drafts) >= count:
            break

    if not drafts:
        drafts.append(ContentDraft(text=raw.strip(), platform=platform, topic=topic))

    return drafts


def _analyse_feedback(
    draft_text: str,
    correction: str | None,
) -> DraftAnalysis:
    """Compute structural diff between draft and correction."""
    word_count_draft = len(draft_text.split())

    if not correction:
        return DraftAnalysis(
            replaced_phrases=[],
            structural_diff="No correction provided.",
            new_topics_in_correction=[],
            word_count_draft=word_count_draft,
            word_count_correction=0,
        )

    draft_words = set(re.findall(r"\b\w+\b", draft_text.lower()))
    correction_words = set(re.findall(r"\b\w+\b", correction.lower()))
    word_count_correction = len(correction.split())

    removed = draft_words - correction_words - _STOP_WORDS
    replaced_phrases = sorted(w for w in removed if len(w) > 3)[:10]

    new_topics = [
        kw for kw in _TOPIC_KEYWORDS
        if kw.lower() in correction.lower() and kw.lower() not in draft_text.lower()
    ]

    draft_sentences = len(re.findall(r"[.!?]+", draft_text))
    correction_sentences = len(re.findall(r"[.!?]+", correction))
    if correction_sentences > draft_sentences:
        structural_diff = f"Correction is longer ({correction_sentences} vs {draft_sentences} sentences)."
    elif correction_sentences < draft_sentences:
        structural_diff = f"Correction is shorter ({correction_sentences} vs {draft_sentences} sentences)."
    else:
        structural_diff = f"Same sentence count ({draft_sentences}), different word choices."

    return DraftAnalysis(
        replaced_phrases=replaced_phrases,
        structural_diff=structural_diff,
        new_topics_in_correction=new_topics,
        word_count_draft=word_count_draft,
        word_count_correction=word_count_correction,
    )


_STOP_WORDS: set[str] = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "i", "you", "he", "she", "we", "they", "my", "your", "our", "their",
    "not", "no", "so", "if", "as", "up", "out", "about", "into", "than",
    "then", "just", "more", "also", "when", "what", "how", "all", "can",
}



def _build_feedback_constraints(feedback_entries: list) -> str:
    """Build a constraint block for the system prompt from feedback_analysis entries.

    Parses stored analysis summaries and extracts:
    - Phrases the user consistently replaces (avoid these)
    - New topics the user added in corrections (include these when relevant)
    """
    if not feedback_entries:
        return ""

    avoid_phrases: list[str] = []
    preferred_topics: list[str] = []

    for entry in feedback_entries[-10:]:  # Use last 10 analyses
        content = entry.content or ""
        # Parse replaced=[ ... ]
        replaced_match = re.search(r"replaced=\[([^\]]*)\]", content)
        if replaced_match:
            raw = replaced_match.group(1)
            phrases = [p.strip().strip("'\"") for p in raw.split(",") if p.strip()]
            avoid_phrases.extend(phrases)
        # Parse new_topics=[ ... ]
        topics_match = re.search(r"new_topics=\[([^\]]*)\]", content)
        if topics_match:
            raw = topics_match.group(1)
            topics = [t.strip().strip("'\"") for t in raw.split(",") if t.strip()]
            preferred_topics.extend(topics)

    # Deduplicate
    avoid_phrases = list(dict.fromkeys(avoid_phrases))[:8]
    preferred_topics = list(dict.fromkeys(preferred_topics))[:5]

    if not avoid_phrases and not preferred_topics:
        return ""

    lines = ["\n\nAprendizaje de feedback anterior:"]
    if avoid_phrases:
        lines.append(f"- EVITAR estas palabras/frases (el usuario las reemplaza): {', '.join(avoid_phrases)}")
    if preferred_topics:
        lines.append(f"- INCLUIR estos temas cuando sea relevante (el usuario los agrega): {', '.join(preferred_topics)}")

    return "\n".join(lines)
