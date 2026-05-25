"""Tests for social input analysis and WeeklyBrief fusion.

All tests use local fixtures — no external API calls.
"""
from __future__ import annotations

import pytest

from app.integrations.input_fusion import fuse_to_weekly_brief
from app.integrations.substack.analyzer import (
    SubstackAnalysis,
    analyze_posts,
    detect_cta_patterns as substack_cta,
    extract_categories,
    extract_keyword_frequencies as substack_keywords,
)
from app.integrations.twitter.analyzer import (
    TwitterAnalysis,
    analyze_tweets,
    detect_cta_patterns as twitter_cta,
    extract_emojis,
    extract_hashtags,
    extract_keyword_frequencies as twitter_keywords,
)
from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief
from app.workflows.weekly import run_weekly_content_plan


# ---------------------------------------------------------------------------
# fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_tweets() -> list[dict]:
    return [
        {
            "id": "1",
            "text": "Just shipped v0.5 of the AI content workflow. Subscribe to my newsletter for the full breakdown 🚀 #buildinpublic #ai",
            "likes": 42,
            "retweets": 7,
            "replies": 12,
        },
        {
            "id": "2",
            "text": "Hot take: most AI agents are over-engineered. You don't need LangChain for a simple workflow. Check out my latest post 👇",
            "likes": 128,
            "retweets": 34,
            "replies": 45,
        },
        {
            "id": "3",
            "text": "Working on memory systems for AI agents. The key insight: store context, not just embeddings. Read more on my blog.",
            "likes": 67,
            "retweets": 15,
            "replies": 22,
        },
        {
            "id": "4",
            "text": "What's your biggest challenge with content creation? 🤔 Reply below — I'm researching for my next deep dive.",
            "likes": 23,
            "retweets": 2,
            "replies": 89,
        },
        {
            "id": "5",
            "text": "Ship fast, iterate faster. Link in bio for the full framework. #shipping #mvp",
            "likes": 15,
            "retweets": 3,
            "replies": 4,
        },
    ]


@pytest.fixture
def sample_posts() -> list[dict]:
    return [
        {
            "title": "Why AI Agents Need Memory First",
            "summary": "Most agent frameworks focus on tool use, but memory is the real bottleneck. Here's how to build persistent context for your AI systems.",
            "published": "2025-01-10T00:00:00+00:00",
            "link": "https://example.substack.com/p/ai-agents-memory",
            "categories": ["AI", "engineering", "agents"],
        },
        {
            "title": "Shipping v0.5: Lessons Learned",
            "summary": "We shipped the latest version of social-ai-os. Subscribe to follow along as we build in public.",
            "published": "2025-01-17T00:00:00+00:00",
            "link": "https://example.substack.com/p/shipping-v05",
            "categories": ["build-in-public", "product"],
        },
        {
            "title": "The Case Against LangChain",
            "summary": "Simple workflows don't need complex abstractions. Join me in exploring lighter alternatives for AI orchestration.",
            "published": "2025-01-24T00:00:00+00:00",
            "link": "https://example.substack.com/p/against-langchain",
            "categories": ["AI", "engineering", "hot-takes"],
        },
    ]


@pytest.fixture
def sample_brand() -> BrandProfile:
    return BrandProfile(
        name="Test Builder",
        handle="@testbuilder",
        voice="Practical builder sharing concrete progress.",
        tone="Clear, direct, useful.",
        personality="Curious, pragmatic.",
        style="Short paragraphs, concrete examples.",
        audience_description="Founders and builders.",
        platforms=["x", "linkedin", "substack"],
        x_handle="testbuilder",
        substack_url="https://example.substack.com",
    )


@pytest.fixture
def existing_brief() -> WeeklyBrief:
    return WeeklyBrief(
        themes=["AI agents"],
        projects=["social-ai-os v0.5"],
        learnings=["MockLLM works for testing"],
        constraints=["No auto-publish"],
        objectives=["Grow newsletter"],
        platform_focus=["x"],
        extra_context="Manual brief for testing.",
    )


# ---------------------------------------------------------------------------
# Twitter analyzer tests
# ---------------------------------------------------------------------------


class TestTwitterAnalyzer:
    def test_extract_keyword_frequencies(self, sample_tweets):
        kw = twitter_keywords(sample_tweets)
        assert "ai" in kw
        assert "workflow" in kw or "content" in kw
        assert kw["ai"] >= 2

    def test_extract_hashtags(self, sample_tweets):
        tags = extract_hashtags(sample_tweets)
        assert "buildinpublic" in tags
        assert "ai" in tags

    def test_extract_emojis(self, sample_tweets):
        emojis = extract_emojis(sample_tweets)
        assert len(emojis) >= 1

    def test_detect_cta_patterns(self, sample_tweets):
        ctas = twitter_cta(sample_tweets)
        assert "subscribe" in ctas
        assert ctas["subscribe"] >= 1

    def test_analyze_tweets_full(self, sample_tweets):
        analysis = analyze_tweets(sample_tweets)
        assert analysis.total_tweets == 5
        assert analysis.avg_likes > 0
        assert analysis.avg_retweets > 0
        assert len(analysis.top_keywords) > 0
        assert len(analysis.cta_patterns) > 0
        assert 0.0 <= analysis.question_ratio <= 1.0

    def test_analyze_empty_tweets(self):
        analysis = analyze_tweets([])
        assert analysis.total_tweets == 0
        assert analysis.avg_likes == 0.0
        assert analysis.top_keywords == {}


# ---------------------------------------------------------------------------
# Substack analyzer tests
# ---------------------------------------------------------------------------


class TestSubstackAnalyzer:
    def test_extract_keyword_frequencies(self, sample_posts):
        kw = substack_keywords(sample_posts)
        assert "ai" in kw
        assert "memory" in kw or "agents" in kw

    def test_extract_categories(self, sample_posts):
        cats = extract_categories(sample_posts)
        assert "ai" in cats
        assert "engineering" in cats

    def test_detect_cta_patterns(self, sample_posts):
        ctas = substack_cta(sample_posts)
        assert "subscribe" in ctas or "join" in ctas

    def test_analyze_posts_full(self, sample_posts):
        analysis = analyze_posts(sample_posts)
        assert analysis.total_posts == 3
        assert len(analysis.top_keywords) > 0
        assert len(analysis.top_categories) > 0
        assert analysis.posting_frequency_days > 0

    def test_analyze_empty_posts(self):
        analysis = analyze_posts([])
        assert analysis.total_posts == 0
        assert analysis.top_keywords == {}


# ---------------------------------------------------------------------------
# input_fusion tests
# ---------------------------------------------------------------------------


class TestInputFusion:
    def test_fuse_twitter_only(self, sample_tweets, sample_brand):
        analysis = analyze_tweets(sample_tweets)
        brief = fuse_to_weekly_brief(
            twitter_analysis=analysis,
            brand_profile=sample_brand,
        )
        assert len(brief.themes) > 0
        assert len(brief.learnings) > 0
        assert "x" in brief.platform_focus
        assert "twitter" in brief.extra_context.lower() or "x/twitter" in brief.extra_context.lower()

    def test_fuse_substack_only(self, sample_posts, sample_brand):
        analysis = analyze_posts(sample_posts)
        brief = fuse_to_weekly_brief(
            substack_analysis=analysis,
            brand_profile=sample_brand,
        )
        assert len(brief.themes) > 0
        assert len(brief.learnings) > 0
        assert "substack" in brief.platform_focus
        assert "substack" in brief.extra_context.lower()

    def test_fuse_combined(self, sample_tweets, sample_posts, sample_brand):
        tw = analyze_tweets(sample_tweets)
        ss = analyze_posts(sample_posts)
        brief = fuse_to_weekly_brief(
            twitter_analysis=tw,
            substack_analysis=ss,
            brand_profile=sample_brand,
        )
        assert len(brief.themes) > 0
        assert "x" in brief.platform_focus
        assert "substack" in brief.platform_focus
        assert len(brief.learnings) >= 2

    def test_fuse_preserves_existing_brief(
        self, sample_tweets, sample_brand, existing_brief
    ):
        analysis = analyze_tweets(sample_tweets)
        brief = fuse_to_weekly_brief(
            twitter_analysis=analysis,
            brand_profile=sample_brand,
            existing_brief=existing_brief,
        )
        assert brief.projects == existing_brief.projects
        assert brief.constraints == existing_brief.constraints
        assert brief.objectives == existing_brief.objectives
        assert "AI agents" in brief.themes

    def test_fuse_empty_inputs(self, sample_brand):
        brief = fuse_to_weekly_brief(brand_profile=sample_brand)
        assert isinstance(brief, WeeklyBrief)
        assert brief.projects == []
        assert brief.constraints == []

    def test_fuse_no_brand(self, sample_tweets):
        analysis = analyze_tweets(sample_tweets)
        brief = fuse_to_weekly_brief(twitter_analysis=analysis)
        assert "x" in brief.platform_focus


# ---------------------------------------------------------------------------
# end-to-end: generated brief feeds existing workflow
# ---------------------------------------------------------------------------


class TestBriefFeedsWorkflow:
    async def test_generated_brief_runs_workflow(self, sample_tweets, sample_posts, sample_brand):
        tw = analyze_tweets(sample_tweets)
        ss = analyze_posts(sample_posts)
        brief = fuse_to_weekly_brief(
            twitter_analysis=tw,
            substack_analysis=ss,
            brand_profile=sample_brand,
        )

        run = await run_weekly_content_plan(brief=brief, brand=sample_brand)
        assert run.status.value == "completed"
        assert len(run.pillars) > 0
        assert len(run.assets) > 0
        assert len(run.traces) > 0
