"""Weekly brief schema."""
from pydantic import BaseModel, Field


class WeeklyBrief(BaseModel):
    """User input for a weekly content cycle."""

    themes: list[str] = Field(description="Main themes or topics for the week.")
    projects: list[str] = Field(default_factory=list, description="Current projects to reference.")
    learnings: list[str] = Field(default_factory=list, description="Recent learnings or insights to share.")
    constraints: list[str] = Field(default_factory=list, description="Constraints or things to avoid.")
    objectives: list[str] = Field(default_factory=list, description="Goals for the week (e.g. grow newsletter).")
    platform_focus: list[str] = Field(default_factory=list, description="Platforms to prioritize.")
    extra_context: str = Field(default="", description="Any additional context.")

    model_config = {"json_schema_extra": {"examples": [{"themes": ["Agent memory systems", "Shipping fast vs perfect"], "projects": ["social-ai-os v0.1"], "learnings": ["LangGraph state machines are overkill for simple flows"], "constraints": ["No generic AI buzzwords"], "objectives": ["Grow Substack by 50 subs"], "platform_focus": ["x", "linkedin"], "extra_context": "Preparing a launch next week."}]}}
