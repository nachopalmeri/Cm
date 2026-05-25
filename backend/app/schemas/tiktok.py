"""TikTok Pack schema."""
from pydantic import BaseModel, Field


class TikTokPack(BaseModel):
    """A complete TikTok content pack."""

    title: str = Field(description="Pack title.")
    hook: str = Field(description="Opening hook.")
    promise: str = Field(description="What the viewer will get.")
    timeline: list[dict] = Field(default_factory=list, description="Timeline per second (e.g. [{\"second\": 0, \"action\": \"hook\"}]).")
    visual_instructions: str = Field(description="Visual direction.")
    voiceover_script: str = Field(description="Voiceover text.")
    on_screen_captions: list[str] = Field(default_factory=list, description="Caption lines timed.")
    recording_checklist: list[str] = Field(default_factory=list, description="Checklist items.")
    cta: str = Field(description="Call to action.")
    hashtags: list[str] = Field(default_factory=list, description="Suggested hashtags.")
    repurpose_links: list[str] = Field(default_factory=list, description="Linked content assets.")
    video_path: str | None = Field(default=None, description="Path to generated .mp4 video.")
