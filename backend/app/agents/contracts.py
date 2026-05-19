"""Agent contracts — explicit input/output models and protocol definition.

Every agent in the system must implement AgentProtocol and use typed
Input/Output models that subclass AgentInput / AgentOutput.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

from pydantic import BaseModel, Field

from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief
from app.schemas.content import ContentAsset, ContentIdea, ContentPillar, Platform
from app.schemas.memory import MemoryItem
from app.schemas.workflow import AgentTrace


# ---------------------------------------------------------------------------
# Base agent I/O
# ---------------------------------------------------------------------------

class AgentInput(BaseModel):
    """Base input for any agent step."""

    brand_profile: BrandProfile = Field(description="Brand identity and voice.")
    weekly_brief: WeeklyBrief = Field(description="User's weekly brief.")
    memory_context: list[MemoryItem] = Field(
        default_factory=list, description="Relevant memory entries."
    )
    previous_outputs: dict[str, Any] = Field(
        default_factory=dict, description="Outputs from prior agent steps (keyed by agent id)."
    )


class AgentOutput(BaseModel):
    """Base output for any agent step."""

    content: Any = Field(description="Primary output payload — typed by each agent.")
    trace: AgentTrace = Field(description="Execution trace for observability.")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Extra metadata.")


# ---------------------------------------------------------------------------
# Strategist-specific I/O
# ---------------------------------------------------------------------------

class WeeklyStrategy(BaseModel):
    """Output of the Strategist agent."""

    narrative: str = Field(description="Weekly narrative arc in 1-2 sentences.")
    pillars: list[ContentPillar] = Field(description="3-5 content pillars for the week.")
    ideas: list[ContentIdea] = Field(description="Content ideas across platforms.")
    platform_distribution: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Platform → list of idea titles for that platform.",
    )


class StrategistInput(AgentInput):
    """Strategist receives the standard agent input."""

    pass


class StrategistOutput(AgentOutput):
    """Strategist produces a WeeklyStrategy."""

    content: WeeklyStrategy = Field(description="The weekly strategy plan.")


# ---------------------------------------------------------------------------
# Writer-specific I/O
# ---------------------------------------------------------------------------

class WriterInput(AgentInput):
    """Writer receives the strategy to produce assets."""

    strategy: WeeklyStrategy = Field(description="Strategy from the Strategist agent.")
    target_platform: Platform = Field(description="Platform to write for.")
    idea_index: int = Field(
        default=0, description="Index of the idea in strategy.ideas to write about."
    )


class WriterOutput(AgentOutput):
    """Writer produces a ContentAsset."""

    content: ContentAsset = Field(description="The produced content asset.")


# ---------------------------------------------------------------------------
# Editor-specific I/O
# ---------------------------------------------------------------------------

class EditorIssue(BaseModel):
    """A single issue found by the Editor."""

    category: str = Field(
        description="Issue category: clarity, authenticity, voice, repetition, hook, ai_slop, risk."
    )
    severity: str = Field(description="Severity: low, medium, high.")
    description: str = Field(description="What the issue is.")
    suggestion: str = Field(default="", description="Suggested fix.")


class EditorReview(BaseModel):
    """Editor review result."""

    approved: bool = Field(description="Whether the asset passes editorial review.")
    issues: list[EditorIssue] = Field(default_factory=list, description="Issues found.")
    revised_asset: ContentAsset | None = Field(
        default=None, description="Revised version of the asset, if edits were made."
    )
    voice_fit_score: float = Field(
        ge=0.0, le=1.0, description="How well the asset matches brand voice (0-1)."
    )


class EditorInput(AgentInput):
    """Editor receives an asset to review."""

    asset: ContentAsset = Field(description="The content asset to review.")


class EditorOutput(AgentOutput):
    """Editor produces a review."""

    content: EditorReview = Field(description="The editorial review.")


# ---------------------------------------------------------------------------
# Agent protocol
# ---------------------------------------------------------------------------

@runtime_checkable
class AgentProtocol(Protocol):
    """Protocol every agent must satisfy.

    Agents are async callables that take a typed AgentInput subclass
    and return a typed AgentOutput subclass.
    """

    agent_id: str
    agent_version: str

    async def run(self, input: AgentInput) -> AgentOutput:
        """Execute the agent logic and return structured output."""
        ...
