"""E2E tests for OrchestratorAgent with MockLLM.

Validates the full Strategist → Writer → Editor pipeline produces
a correct WorkflowRun with pillars, assets, and traces.
"""
from __future__ import annotations

import ast
import asyncio
from pathlib import Path

import pytest
import pytest_asyncio

from app.agents.contracts import AgentInput
from app.agents.llm import MockLLM
from app.agents.orchestrator import OrchestratorAgent
from app.prompts.registry import PromptRegistry
from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief
from app.schemas.memory import MemoryItem, MemoryType
from app.schemas.workflow import WorkflowRun, WorkflowStatus


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_brand() -> BrandProfile:
    return BrandProfile(
        name="Test Brand",
        handle="@testbrand",
        voice="Irreverent builder who ships fast.",
        tone="Casual, data-driven, no fluff.",
        personality="Curious, skeptical of hype.",
        opinions=["MVP > perfection"],
        style="Short paragraphs. Questions as hooks.",
        forbidden_topics=["Politics"],
        audience_description="Founders and developers.",
        platforms=["x", "linkedin"],
    )


@pytest.fixture
def sample_brief() -> WeeklyBrief:
    return WeeklyBrief(
        themes=["Agent memory systems"],
        projects=["social-ai-os v0.1"],
        learnings=["LangGraph is overkill for simple flows"],
        constraints=["No generic AI buzzwords"],
        objectives=["Grow newsletter"],
        platform_focus=["x", "linkedin"],
    )


@pytest.fixture
def sample_memory() -> list[MemoryItem]:
    return [
        MemoryItem(
            id="mem-test",
            memory_type=MemoryType.CONTENT,
            key="top_hooks",
            value="Questions as hooks work best on X.",
            source="test",
        ),
    ]


@pytest.fixture
def agent_input(sample_brand, sample_brief, sample_memory) -> AgentInput:
    return AgentInput(
        brand_profile=sample_brand,
        weekly_brief=sample_brief,
        memory_context=sample_memory,
        previous_outputs={},
    )


@pytest.fixture
def orchestrator() -> OrchestratorAgent:
    llm = MockLLM()
    registry = PromptRegistry()
    return OrchestratorAgent(llm=llm, registry=registry)


# ---------------------------------------------------------------------------
# E2E tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_orchestrator_returns_workflow_run(orchestrator, agent_input):
    """OrchestratorAgent.run() must return a WorkflowRun instance."""
    result = await orchestrator.run(agent_input)
    assert isinstance(result, WorkflowRun)


@pytest.mark.asyncio
async def test_orchestrator_status_completed(orchestrator, agent_input):
    """WorkflowRun status must be COMPLETED."""
    result = await orchestrator.run(agent_input)
    assert result.status == WorkflowStatus.COMPLETED


@pytest.mark.asyncio
async def test_orchestrator_produces_pillars(orchestrator, agent_input):
    """WorkflowRun must contain at least 1 pillar."""
    result = await orchestrator.run(agent_input)
    assert len(result.pillars) >= 1


@pytest.mark.asyncio
async def test_orchestrator_produces_assets(orchestrator, agent_input):
    """WorkflowRun must contain at least 1 content asset."""
    result = await orchestrator.run(agent_input)
    assert len(result.assets) >= 1
    # Each asset should have a non-empty body
    for asset in result.assets:
        assert asset.body, f"Asset {asset.id} has empty body"


@pytest.mark.asyncio
async def test_orchestrator_produces_traces(orchestrator, agent_input):
    """WorkflowRun must contain traces for strategist + writer + editor (>= 3)."""
    result = await orchestrator.run(agent_input)
    assert len(result.traces) >= 3

    agent_names = {t.agent for t in result.traces}
    assert "strategist" in agent_names, "Missing strategist trace"
    assert "writer" in agent_names, "Missing writer trace"
    assert "editor" in agent_names, "Missing editor trace"


@pytest.mark.asyncio
async def test_orchestrator_brand_handle_matches(orchestrator, agent_input):
    """WorkflowRun.brand_handle must match input brand handle."""
    result = await orchestrator.run(agent_input)
    assert result.brand_handle == agent_input.brand_profile.handle


@pytest.mark.asyncio
async def test_orchestrator_workflow_type(orchestrator, agent_input):
    """WorkflowRun.workflow_type must be 'weekly-content-plan'."""
    result = await orchestrator.run(agent_input)
    assert result.workflow_type == "weekly-content-plan"


@pytest.mark.asyncio
async def test_orchestrator_assets_have_status(orchestrator, agent_input):
    """Each asset must have a status of 'approved' or 'failed'."""
    result = await orchestrator.run(agent_input)
    for asset in result.assets:
        assert asset.status in ("approved", "failed"), f"Asset {asset.id} has unexpected status: {asset.status}"


@pytest.mark.asyncio
async def test_orchestrator_produces_tiktok_packs(orchestrator, agent_input):
    """WorkflowRun must contain TikTok packs for approved TIKTOK assets."""
    result = await orchestrator.run(agent_input)
    assert len(result.tiktok_packs) >= 1
    for pack in result.tiktok_packs:
        assert pack.hook
        assert pack.voiceover_script
        assert pack.cta
        assert len(pack.hashtags) > 0
        assert len(pack.timeline) > 0


@pytest.mark.asyncio
async def test_orchestrator_tiktok_pack_traces(orchestrator, agent_input):
    """Traces must include tiktok_pack generator steps."""
    result = await orchestrator.run(agent_input)
    agent_names = {t.agent for t in result.traces}
    assert "tiktok_pack" in agent_names, "Missing tiktok_pack trace"


# ---------------------------------------------------------------------------
# Static import check
# ---------------------------------------------------------------------------

def test_no_app_models_import_in_agents():
    """No file under app/agents/ must import from app.models."""
    agents_dir = Path(__file__).resolve().parent.parent.parent / "app" / "agents"
    for py_file in agents_dir.glob("*.py"):
        source = py_file.read_text(encoding="utf-8")
        tree = ast.parse(source)
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module:
                assert not node.module.startswith("app.models"), (
                    f"{py_file.name} imports from {node.module}"
                )
