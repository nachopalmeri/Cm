"""Weekly content planning workflow — Orchestrator-driven pipeline."""
from __future__ import annotations

import asyncio
import logging

from app.agents.contracts import AgentInput
from app.agents.llm import LLMProvider, MockLLM
from app.agents.orchestrator import OrchestratorAgent
from app.integrations.input_fusion import fuse_to_weekly_brief
from app.integrations.substack.analyzer import analyze_posts
from app.integrations.substack.client import SubstackClient
from app.integrations.twitter.analyzer import analyze_tweets
from app.integrations.twitter.client import TwitterClient
from app.prompts.registry import PromptRegistry
from app.schemas.api import SocialSources
from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief
from app.schemas.memory import MemoryItem
from app.schemas.workflow import WorkflowRun

logger = logging.getLogger(__name__)


def run_weekly_content_plan(
    brief: WeeklyBrief,
    brand: BrandProfile,
    memory_context: list[MemoryItem] | None = None,
    llm: LLMProvider | None = None,
) -> WorkflowRun:
    """Run the weekly content planning workflow synchronously.

    Creates an Orchestrator with the given LLM provider (defaults to MockLLM)
    and executes the Strategist → Writer → Editor pipeline.

    Args:
        brief: User's weekly content brief.
        brand: Brand profile for voice and tone.
        memory_context: Relevant memory entries (optional).
        llm: LLM provider implementation (defaults to MockLLM).

    Returns:
        A WorkflowRun with pillars, assets, traces and status.
    """
    provider = llm or MockLLM()
    registry = PromptRegistry()
    orchestrator = OrchestratorAgent(llm=provider, registry=registry)

    agent_input = AgentInput(
        brand_profile=brand,
        weekly_brief=brief,
        memory_context=memory_context or [],
        previous_outputs={},
    )

    loop = _get_or_create_event_loop()
    return loop.run_until_complete(orchestrator.run(agent_input))


def _get_or_create_event_loop() -> asyncio.AbstractEventLoop:
    """Get an existing event loop or create a new one."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError("Event loop is closed")
        return loop
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop


def enrich_brief_from_social(
    brief: WeeklyBrief,
    brand: BrandProfile,
    social_sources: SocialSources,
) -> WeeklyBrief:
    """Enrich a WeeklyBrief with real social input analysis.

    Fetches tweets and/or Substack posts, runs local NLP analysis,
    and fuses results into the brief. Falls back to the original
    brief on any error.
    """
    try:
        loop = _get_or_create_event_loop()
        return loop.run_until_complete(
            _async_enrich(brief, brand, social_sources)
        )
    except Exception:
        logger.exception("Social enrichment failed, using original brief")
        return brief


async def _async_enrich(
    brief: WeeklyBrief,
    brand: BrandProfile,
    social_sources: SocialSources,
) -> WeeklyBrief:
    """Async core of social enrichment."""
    from app.integrations.twitter.analyzer import TwitterAnalysis
    from app.integrations.substack.analyzer import SubstackAnalysis

    twitter_analysis: TwitterAnalysis | None = None
    substack_analysis: SubstackAnalysis | None = None

    if social_sources.twitter_handle:
        try:
            client = TwitterClient()
            tweets = await client.fetch_recent_tweets(
                social_sources.twitter_handle
            )
            if tweets:
                twitter_analysis = analyze_tweets(tweets)
        except Exception:
            logger.exception("Twitter fetch/analysis failed")

    if social_sources.substack_url:
        try:
            client = SubstackClient()
            posts = await client.fetch_posts(social_sources.substack_url)
            if posts:
                substack_analysis = analyze_posts(posts)
        except Exception:
            logger.exception("Substack fetch/analysis failed")

    return fuse_to_weekly_brief(
        twitter_analysis=twitter_analysis,
        substack_analysis=substack_analysis,
        brand_profile=brand,
        existing_brief=brief,
    )
