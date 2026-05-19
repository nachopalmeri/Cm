"""Brand memory schemas."""
from pydantic import BaseModel, Field


class BrandProfile(BaseModel):
    """Core brand identity and voice definition."""

    name: str = Field(description="Brand or personal name.")
    handle: str = Field(description="Primary social handle.")
    voice: str = Field(description="Voice description (e.g. irreverent expert).")
    tone: str = Field(description="Tone guidelines (e.g. casual, data-driven).")
    personality: str = Field(description="Personality traits in 1-2 sentences.")
    opinions: list[str] = Field(default_factory=list, description="Strong opinions or takes.")
    style: str = Field(description="Writing style notes.")
    forbidden_topics: list[str] = Field(default_factory=list, description="Topics to avoid.")
    audience_description: str = Field(description="Target audience description.")
    platforms: list[str] = Field(default_factory=list, description="Active platforms.")
    x_handle: str = Field(default="", description="Twitter/X handle (without @).")
    substack_url: str = Field(default="", description="Substack publication URL.")

    model_config = {"json_schema_extra": {"examples": [{"name": "Ignacio Palmeri", "handle": "@ipalmeri", "voice": "Irreverent builder who ships fast.", "tone": "Casual, data-driven, no fluff.", "personality": "Curious, skeptical of hype, generous with knowledge.", "opinions": ["MVP > perfection", "AI agents need memory first"], "style": "Short paragraphs. Questions as hooks. Concrete examples.", "forbidden_topics": ["Politics", "Drama"], "audience_description": "Founders, developers, tech-curious professionals.", "platforms": ["x", "linkedin", "substack"]}]}}
