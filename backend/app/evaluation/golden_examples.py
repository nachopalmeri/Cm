"""Golden examples — minimal dataset for agent evaluation.

Each example maps an agent id to a list of (input, expected_output) pairs.
Used by the evaluator to measure agent quality against known-good outputs.
"""
from __future__ import annotations

from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief
from app.schemas.content import ContentAsset, ContentIdea, ContentPillar, Platform
from app.schemas.memory import MemoryItem, MemoryType
from app.agents.contracts import WeeklyStrategy, EditorReview, EditorIssue


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

_SAMPLE_BRAND = BrandProfile(
    name="Ignacio Palmeri",
    handle="@ipalmeri",
    voice="Irreverent builder who ships fast.",
    tone="Casual, data-driven, no fluff.",
    personality="Curious, skeptical of hype, generous with knowledge.",
    opinions=["MVP > perfection", "AI agents need memory first"],
    style="Short paragraphs. Questions as hooks. Concrete examples.",
    forbidden_topics=["Politics", "Drama"],
    audience_description="Founders, developers, tech-curious professionals.",
    platforms=["x", "linkedin", "substack"],
)

_SAMPLE_BRIEF = WeeklyBrief(
    themes=["Agent memory systems", "Shipping fast vs perfect"],
    projects=["social-ai-os v0.1"],
    learnings=["LangGraph state machines are overkill for simple flows"],
    constraints=["No generic AI buzzwords"],
    objectives=["Grow Substack by 50 subs"],
    platform_focus=["x", "linkedin"],
    extra_context="Preparing a launch next week.",
)

_SAMPLE_MEMORY = [
    MemoryItem(
        id="mem-001",
        memory_type=MemoryType.CONTENT,
        key="top_hooks",
        value="Questions as hooks work best on X. Contrarian opens on LinkedIn.",
        source="analytics_week_2",
    ),
]


# ---------------------------------------------------------------------------
# Strategist golden examples
# ---------------------------------------------------------------------------

_STRATEGIST_GOLDEN = WeeklyStrategy(
    narrative="This week we position the brand as a pragmatic builder who ships AI tools with real memory — not just prompts.",
    pillars=[
        ContentPillar(name="Memory-first AI", description="Why AI agents need persistent memory to be useful.", platforms=[Platform.X, Platform.LINKEDIN]),
        ContentPillar(name="Ship fast, iterate", description="MVP mindset applied to AI products.", platforms=[Platform.X]),
        ContentPillar(name="Builder in public", description="Sharing the journey of building social-ai-os.", platforms=[Platform.X, Platform.SUBSTACK]),
    ],
    ideas=[
        ContentIdea(title="Why your AI agent forgets everything", hook="Your AI assistant has amnesia.", angle="Memory is the missing layer in AI agents.", platform=Platform.X, format="thread", pillar="Memory-first AI"),
        ContentIdea(title="MVP > Perfection: a framework for AI products", hook="Stop polishing. Start shipping.", angle="How to validate AI product ideas in 48 hours.", platform=Platform.X, format="post", pillar="Ship fast, iterate"),
        ContentIdea(title="Building social-ai-os: week 1", hook="I'm building an AI OS for personal brands.", angle="What I learned building the agent layer.", platform=Platform.LINKEDIN, format="post", pillar="Builder in public"),
    ],
    platform_distribution={
        "x": ["Why your AI agent forgets everything", "MVP > Perfection: a framework for AI products"],
        "linkedin": ["Building social-ai-os: week 1"],
        "substack": ["Building social-ai-os: week 1"],
    },
)


# ---------------------------------------------------------------------------
# Writer golden examples
# ---------------------------------------------------------------------------

_WRITER_GOLDEN_ASSET = ContentAsset(
    id="asset-golden-001",
    idea_id="idea-0",
    platform=Platform.X,
    format="thread",
    body="Your AI assistant has amnesia.\n\nYou ask it to write like you. It forgets your voice by tomorrow.\n\nThe missing layer in AI agents isn't a better model.\n\nIt's MEMORY.\n\nHere's why persistent memory changes everything for AI-native workflows 🧵",
    status="draft",
    notes="",
)


# ---------------------------------------------------------------------------
# Editor golden examples
# ---------------------------------------------------------------------------

_EDITOR_GOLDEN_REVIEW = EditorReview(
    approved=True,
    issues=[],
    revised_asset=None,
    voice_fit_score=0.85,
)

_EDITOR_GOLDEN_REVIEW_WITH_ISSUES = EditorReview(
    approved=False,
    issues=[
        EditorIssue(
            category="ai_slop",
            severity="medium",
            description="Phrase 'game-changing' sounds like generic AI output.",
            suggestion="Replace with a concrete observation or specific claim.",
        ),
    ],
    revised_asset=None,
    voice_fit_score=0.6,
)


# ---------------------------------------------------------------------------
# Golden examples registry
# ---------------------------------------------------------------------------

GOLDEN_EXAMPLES: dict[str, list[dict]] = {
    "strategist": [
        {
            "input": {
                "brand_profile": _SAMPLE_BRAND,
                "weekly_brief": _SAMPLE_BRIEF,
                "memory_context": _SAMPLE_MEMORY,
            },
            "expected": _STRATEGIST_GOLDEN,
        },
    ],
    "writer": [
        {
            "input": {
                "brand_profile": _SAMPLE_BRAND,
                "weekly_brief": _SAMPLE_BRIEF,
                "memory_context": _SAMPLE_MEMORY,
                "strategy": _STRATEGIST_GOLDEN,
                "target_platform": Platform.X,
                "idea_index": 0,
            },
            "expected": _WRITER_GOLDEN_ASSET,
        },
    ],
    "editor": [
        {
            "input": {
                "brand_profile": _SAMPLE_BRAND,
                "asset": _WRITER_GOLDEN_ASSET,
            },
            "expected": _EDITOR_GOLDEN_REVIEW,
        },
        {
            "input": {
                "brand_profile": _SAMPLE_BRAND,
                "asset": ContentAsset(
                    id="asset-golden-002",
                    idea_id="idea-0",
                    platform=Platform.LINKEDIN,
                    format="post",
                    body="This game-changing AI tool will revolutionize how you leverage content. In today's landscape, it's not just about posting — it's about diving deep into strategy.",
                    status="draft",
                    notes="",
                ),
            },
            "expected": _EDITOR_GOLDEN_REVIEW_WITH_ISSUES,
        },
    ],
}
