"""API request/response schemas."""
import uuid

from pydantic import BaseModel, Field

from .brand import BrandProfile
from .brief import WeeklyBrief
from .workflow import WorkflowRun


class SocialSources(BaseModel):
    """Optional social media handles for automatic brief enrichment."""

    twitter_handle: str | None = None
    substack_url: str | None = None


class WeeklyContentPlanRequest(BaseModel):
    """Request body for POST /workflows/weekly-content-plan."""

    brief: WeeklyBrief
    brand_profile: BrandProfile
    social_sources: SocialSources | None = None


class WeeklyContentPlanResponse(BaseModel):
    """Response body for POST /workflows/weekly-content-plan."""

    workflow_run: WorkflowRun


# ---------------------------------------------------------------------------
# Ghostwriter schemas
# ---------------------------------------------------------------------------

class IngestRequest(BaseModel):
    """Request body for POST /ghostwriter/ingest."""

    texts: list[str] = Field(description="Raw content samples (tweets, posts, notes).")
    source: str = Field(default="manual", description="Source label (e.g. 'twitter', 'manual').")
    brand_profile: BrandProfile


class IngestResponse(BaseModel):
    """Response body for POST /ghostwriter/ingest."""

    ingested: int = Field(description="Number of texts stored in BrandMemory.")
    voice_updated: bool = Field(description="Whether the voice profile was updated.")


class VoiceProfileResponse(BaseModel):
    """Response body for GET /ghostwriter/profile."""

    brand_id: str = Field(description="Brand profile ID this voice profile belongs to.")
    topics: list[str] = Field(description="Recurring topics detected from stored samples.")
    tone: str = Field(description="Dominant tone inferred from samples.")
    style: str = Field(description="Style notes inferred from samples.")
    examples: list[str] = Field(description="Representative approved writing samples.")
    total_samples: int = Field(description="Total number of stored voice samples.")


class ContentDraft(BaseModel):
    """A single generated content draft."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique draft ID.")
    text: str = Field(description="Generated content text.")
    platform: str = Field(description="Target platform.")
    topic: str = Field(description="Topic the draft covers.")
    approved: bool | None = Field(default=None, description="Approval state (None = pending).")


class GenerateRequest(BaseModel):
    """Request body for POST /ghostwriter/generate."""

    topic: str = Field(description="Topic to generate content about.")
    platform: str = Field(description="Target platform (x, linkedin, substack, tiktok).")
    count: int = Field(default=3, ge=1, le=10, description="Number of draft variants.")
    brand_profile: BrandProfile


class GenerateResponse(BaseModel):
    """Response body for POST /ghostwriter/generate."""

    options: list[ContentDraft] = Field(description="Generated content drafts ready for review.")


class FeedbackRequest(BaseModel):
    """Request body for POST /ghostwriter/feedback."""

    draft_id: str = Field(description="ID of the draft being evaluated.")
    draft_text: str = Field(description="Original draft text.")
    approved: bool = Field(description="Whether the draft was approved.")
    correction: str | None = Field(default=None, description="Corrected or rewritten version.")
    brand_profile_id: uuid.UUID = Field(description="Brand profile this feedback belongs to.")


class DraftAnalysis(BaseModel):
    """Structural analysis of a draft and its correction."""

    replaced_phrases: list[str] = Field(
        default_factory=list,
        description="Words or phrases from the draft replaced in the correction.",
    )
    structural_diff: str = Field(
        default="",
        description="High-level structural difference between draft and correction.",
    )
    new_topics_in_correction: list[str] = Field(
        default_factory=list,
        description="Topics present in the correction but absent in the draft.",
    )
    word_count_draft: int = Field(default=0)
    word_count_correction: int = Field(default=0)


class FeedbackResponse(BaseModel):
    """Response body for POST /ghostwriter/feedback."""

    stored: bool = Field(description="Whether the feedback was persisted.")
    memory_updated: bool = Field(description="Whether BrandMemory was updated.")
    analysis: DraftAnalysis = Field(description="Structural analysis of draft vs correction.")
