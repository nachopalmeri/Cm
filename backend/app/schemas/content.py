"""Content production schemas."""
from enum import Enum
from pydantic import BaseModel, Field


class Platform(str, Enum):
    """Supported platforms."""
    X = "x"
    LINKEDIN = "linkedin"
    SUBSTACK = "substack"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"


class ContentPillar(BaseModel):
    """A content pillar for the week."""

    name: str = Field(description="Pillar name.")
    description: str = Field(description="What this pillar covers.")
    platforms: list[Platform] = Field(default_factory=list, description="Platforms for this pillar.")


class ContentIdea(BaseModel):
    """A raw content idea."""

    title: str = Field(description="Idea title.")
    hook: str = Field(description="Hook or opening line.")
    angle: str = Field(description="Specific angle or take.")
    platform: Platform = Field(description="Target platform.")
    format: str = Field(description="Format (post, thread, carousel, video-script).")
    pillar: str = Field(description="Associated pillar name.")


class ContentAsset(BaseModel):
    """A produced content asset ready for review."""

    id: str = Field(description="Unique asset id.")
    idea_id: str = Field(description="Source idea id.")
    platform: Platform = Field(description="Target platform.")
    format: str = Field(description="Asset format.")
    body: str = Field(description="Full body text.")
    status: str = Field(default="draft", description="draft, approved, rejected, published.")
    notes: str = Field(default="", description="Editor or writer notes.")

    model_config = {"json_schema_extra": {"examples": [{"id": "asset-001", "idea_id": "idea-001", "platform": "x", "format": "thread", "body": "Thread body...", "status": "draft", "notes": "Strong hook, check CTA."}]}}
