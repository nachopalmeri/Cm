"""Default Telegram workflow inputs."""
from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief


def default_brand_profile() -> BrandProfile:
    return BrandProfile(
        name="Social AI OS",
        handle="@socialaios",
        voice="Practical builder sharing concrete progress.",
        tone="Clear, direct, and useful.",
        personality="Curious, pragmatic, and focused on shipping.",
        style="Short paragraphs, concrete examples, no hype.",
        audience_description="Founders, builders, and operators using AI for content systems.",
        platforms=["x", "linkedin"],
    )


def default_weekly_brief() -> WeeklyBrief:
    return WeeklyBrief(
        themes=["Building AI-assisted content workflows", "Human approval before publishing"],
        projects=["social-ai-os v0.3.0"],
        learnings=["Telegram can be a lightweight human control surface"],
        constraints=["Do not publish automatically", "Avoid generic AI buzzwords"],
        objectives=["Validate weekly workflow control from Telegram"],
        platform_focus=["x", "linkedin"],
        extra_context="Telegram is only an approval and control interface in this version.",
    )
