"""Fuse Twitter + Substack analysis into a WeeklyBrief.

Pure function — no network, no side effects. Designed to be called before
the existing weekly workflow so the brief reflects real social activity.
"""
from __future__ import annotations

from app.integrations.substack.analyzer import SubstackAnalysis
from app.integrations.twitter.analyzer import TwitterAnalysis
from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief


def fuse_to_weekly_brief(
    twitter_analysis: TwitterAnalysis | None = None,
    substack_analysis: SubstackAnalysis | None = None,
    brand_profile: BrandProfile | None = None,
    existing_brief: WeeklyBrief | None = None,
) -> WeeklyBrief:
    """Build a WeeklyBrief enriched with social input analysis.

    Mapping:
        themes        ← top keywords from both platforms + existing themes
        learnings     ← engagement insights + CTA patterns detected
        platform_focus ← platforms with actual activity
        extra_context ← human-readable summary of what was analyzed
        projects, constraints, objectives ← preserved from existing_brief
    """
    base = existing_brief or WeeklyBrief(themes=[])

    themes = _merge_themes(twitter_analysis, substack_analysis, base.themes)
    learnings = _merge_learnings(twitter_analysis, substack_analysis, base.learnings)
    platform_focus = _merge_platform_focus(
        twitter_analysis, substack_analysis, brand_profile, base.platform_focus
    )
    extra_context = _build_extra_context(twitter_analysis, substack_analysis, base.extra_context)

    return WeeklyBrief(
        themes=themes,
        projects=base.projects,
        learnings=learnings,
        constraints=base.constraints,
        objectives=base.objectives,
        platform_focus=platform_focus,
        extra_context=extra_context,
    )


# ---------------------------------------------------------------------------
# merge helpers
# ---------------------------------------------------------------------------


def _merge_themes(
    twitter: TwitterAnalysis | None,
    substack: SubstackAnalysis | None,
    existing: list[str],
) -> list[str]:
    seen: set[str] = set(t.lower() for t in existing)
    merged = list(existing)

    for analysis in (twitter, substack):
        if analysis is None:
            continue
        for keyword in analysis.top_keywords:
            if keyword.lower() not in seen:
                merged.append(keyword)
                seen.add(keyword.lower())

    return merged[:12]


def _merge_learnings(
    twitter: TwitterAnalysis | None,
    substack: SubstackAnalysis | None,
    existing: list[str],
) -> list[str]:
    learnings = list(existing)

    if twitter is not None and twitter.total_tweets > 0:
        learnings.append(
            f"Twitter engagement: avg {twitter.avg_likes:.0f} likes, "
            f"{twitter.avg_retweets:.0f} retweets across {twitter.total_tweets} tweets"
        )
        if twitter.cta_patterns:
            top_cta = list(twitter.cta_patterns.keys())[:3]
            learnings.append(f"Top Twitter CTAs: {', '.join(top_cta)}")
        if twitter.question_ratio > 0.2:
            learnings.append("High question-ratio on Twitter — audience engagement focus")

    if substack is not None and substack.total_posts > 0:
        learnings.append(
            f"Substack: {substack.total_posts} posts analyzed, "
            f"avg posting every {substack.posting_frequency_days:.1f} days"
        )
        if substack.top_categories:
            learnings.append(f"Substack categories: {', '.join(substack.top_categories[:5])}")
        if substack.cta_patterns:
            top_cta = list(substack.cta_patterns.keys())[:3]
            learnings.append(f"Top Substack CTAs: {', '.join(top_cta)}")

    return learnings


def _merge_platform_focus(
    twitter: TwitterAnalysis | None,
    substack: SubstackAnalysis | None,
    brand: BrandProfile | None,
    existing: list[str],
) -> list[str]:
    focus: list[str] = list(existing)

    if twitter is not None and twitter.total_tweets > 0:
        if "x" not in focus:
            focus.append("x")

    if substack is not None and substack.total_posts > 0:
        if "substack" not in focus:
            focus.append("substack")

    if brand is not None:
        for p in brand.platforms:
            if p not in focus:
                focus.append(p)

    return focus


def _build_extra_context(
    twitter: TwitterAnalysis | None,
    substack: SubstackAnalysis | None,
    existing: str,
) -> str:
    parts: list[str] = []

    if twitter is not None and twitter.total_tweets > 0:
        top_kw = list(twitter.top_keywords.keys())[:5]
        parts.append(
            f"X/Twitter: {twitter.total_tweets} tweets analyzed. "
            f"Top topics: {', '.join(top_kw)}. "
            f"Top hashtags: {', '.join(twitter.top_hashtags[:5])}."
        )

    if substack is not None and substack.total_posts > 0:
        top_kw = list(substack.top_keywords.keys())[:5]
        parts.append(
            f"Substack: {substack.total_posts} posts analyzed. "
            f"Top topics: {', '.join(top_kw)}. "
            f"Categories: {', '.join(substack.top_categories[:5])}."
        )

    if existing:
        parts.append(existing)

    return " | ".join(parts)
