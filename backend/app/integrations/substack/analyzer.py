"""Local NLP analysis of Substack posts — no external API calls."""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime

from app.integrations.twitter.analyzer import (
    _STOPWORDS,
    _tokenize,
    _CTA_PATTERNS,
)


# ---------------------------------------------------------------------------
# output model
# ---------------------------------------------------------------------------


@dataclass
class SubstackAnalysis:
    """Result of local post analysis."""

    top_keywords: dict[str, int] = field(default_factory=dict)
    total_posts: int = 0
    top_categories: list[str] = field(default_factory=list)
    avg_summary_length: float = 0.0
    question_ratio: float = 0.0
    cta_patterns: dict[str, int] = field(default_factory=dict)
    posting_frequency_days: float = 0.0


# ---------------------------------------------------------------------------
# public API
# ---------------------------------------------------------------------------


def analyze_posts(posts: list[dict]) -> SubstackAnalysis:
    """Run all local analysis steps on a list of normalized posts."""
    if not posts:
        return SubstackAnalysis()

    return SubstackAnalysis(
        top_keywords=extract_keyword_frequencies(posts),
        total_posts=len(posts),
        top_categories=extract_categories(posts),
        avg_summary_length=_avg_summary_length(posts),
        question_ratio=_question_ratio(posts),
        cta_patterns=detect_cta_patterns(posts),
        posting_frequency_days=_posting_frequency(posts),
    )


# ---------------------------------------------------------------------------
# individual analysis functions (pure, testable)
# ---------------------------------------------------------------------------


def extract_keyword_frequencies(
    posts: list[dict], top_n: int = 15
) -> dict[str, int]:
    """Return {word: count} for the *top_n* most frequent non-stopwords."""
    counter: Counter[str] = Counter()
    for p in posts:
        text = f"{p.get('title', '')} {p.get('summary', '')}"
        words = _tokenize(text)
        counter.update(w for w in words if w not in _STOPWORDS and len(w) > 1)
    return dict(counter.most_common(top_n))


def extract_categories(posts: list[dict], top_n: int = 10) -> list[str]:
    """Return most frequent categories across posts."""
    counter: Counter[str] = Counter()
    for p in posts:
        for cat in p.get("categories", []):
            counter[cat.lower()] += 1
    return [cat for cat, _ in counter.most_common(top_n)]


def detect_cta_patterns(posts: list[dict]) -> dict[str, int]:
    """Count CTA patterns found across posts."""
    counts: dict[str, int] = {}
    for p in posts:
        text = f"{p.get('title', '')} {p.get('summary', '')}".lower()
        for pattern, label in _CTA_PATTERNS:
            if re.search(pattern, text):
                counts[label] = counts.get(label, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: x[1], reverse=True))


# ---------------------------------------------------------------------------
# internal helpers
# ---------------------------------------------------------------------------


def _avg_summary_length(posts: list[dict]) -> float:
    lengths = [len(p.get("summary", "")) for p in posts]
    return sum(lengths) / len(lengths) if lengths else 0.0


def _question_ratio(posts: list[dict]) -> float:
    if not posts:
        return 0.0
    questions = sum(
        1 for p in posts
        if "?" in p.get("title", "") or "?" in p.get("summary", "")
    )
    return questions / len(posts)


def _posting_frequency(posts: list[dict]) -> float:
    """Average days between posts (lower = more frequent)."""
    dates = []
    for p in posts:
        d = p.get("published", "")
        if d:
            try:
                dates.append(datetime.fromisoformat(d))
            except (ValueError, TypeError):
                pass
    if len(dates) < 2:
        return 0.0
    dates.sort()
    deltas = [(dates[i] - dates[i - 1]).total_seconds() / 86400 for i in range(1, len(dates))]
    return sum(deltas) / len(deltas)
