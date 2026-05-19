"""Local NLP analysis of tweets — no external API calls."""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# stopwords — minimal English set, avoids extra dependencies
# ---------------------------------------------------------------------------
_STOPWORDS: set[str] = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "can", "shall", "you", "your",
    "yours", "i", "my", "me", "we", "us", "our", "it", "its", "they",
    "them", "their", "this", "that", "these", "those", "not", "no", "nor",
    "so", "if", "then", "than", "too", "very", "just", "about", "also",
    "am", "he", "she", "his", "her", "him", "all", "as", "up", "out",
    "when", "who", "how", "what", "which", "where", "why", "into", "over",
    "some", "any", "each", "every", "both", "few", "more", "most", "other",
    "only", "own", "same", "here", "there", "now", "still", "well", "get",
    "got", "go", "going", "one", "two", "like", "make", "made", "really",
    "much", "many", "way", "even", "back", "good", "new", "see", "know",
    "think", "say", "said", "people", "time", "thing", "things", "day",
    "first", "last", "great", "need", "want", "right", "yeah", "yes",
    "actually", "already", "always", "never", "ever", "since", "through",
    "while", "after", "before", "between", "during", "because", "although",
    "though", "without", "within", "along", "around", "away", "down",
    "off", "under", "again", "further", "once", "yet", "per", "next",
    "let", "s", "t", "don", "doesn", "isn", "aren", "wasn", "weren",
    "won", "wouldn", "couldn", "shouldn", "haven", "hasn", "hadn",
}

_CTA_PATTERNS: list[tuple[str, str]] = [
    (r"subscribe", "subscribe"),
    (r"sign\s*up", "signup"),
    (r"read\s*(more|the\s*full)", "read_more"),
    (r"check\s*(it\s*)?out", "check_out"),
    (r"link\s*(in\s*)?bio", "link_in_bio"),
    (r"follow\s*(me|us)", "follow"),
    (r"dm\s*(me|us|for)", "dm"),
    (r"join\s*(us|me|the)", "join"),
    (r"grab\s*(your|a)", "grab"),
    (r"get\s*(it|yours|started)", "get_started"),
    (r"learn\s*more", "learn_more"),
    (r"watch\s*(the\s*)?(full\s*)?video", "watch_video"),
    (r"download", "download"),
    (r"register", "register"),
    (r"reply\s*(with|below)", "reply"),
    (r"share\s*(this|your)", "share"),
    (r"retweet", "retweet"),
    (r"comment\s*(below|your)", "comment"),
    (r"click\s*(the\s*)?link", "click_link"),
    (r"visit\s*(my|our)", "visit"),
]


# ---------------------------------------------------------------------------
# output model
# ---------------------------------------------------------------------------


@dataclass
class TwitterAnalysis:
    """Result of local tweet analysis."""

    top_keywords: dict[str, int] = field(default_factory=dict)
    total_tweets: int = 0
    avg_likes: float = 0.0
    avg_retweets: float = 0.0
    avg_replies: float = 0.0
    top_hashtags: list[str] = field(default_factory=list)
    top_emojis: list[str] = field(default_factory=list)
    avg_text_length: float = 0.0
    question_ratio: float = 0.0
    cta_patterns: dict[str, int] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# public API
# ---------------------------------------------------------------------------


def analyze_tweets(tweets: list[dict]) -> TwitterAnalysis:
    """Run all local analysis steps on a list of normalized tweets."""
    if not tweets:
        return TwitterAnalysis()

    return TwitterAnalysis(
        top_keywords=extract_keyword_frequencies(tweets),
        total_tweets=len(tweets),
        avg_likes=_safe_avg(tweets, "likes"),
        avg_retweets=_safe_avg(tweets, "retweets"),
        avg_replies=_safe_avg(tweets, "replies"),
        top_hashtags=extract_hashtags(tweets),
        top_emojis=extract_emojis(tweets),
        avg_text_length=_avg_text_length(tweets),
        question_ratio=_question_ratio(tweets),
        cta_patterns=detect_cta_patterns(tweets),
    )


# ---------------------------------------------------------------------------
# individual analysis functions (pure, testable)
# ---------------------------------------------------------------------------


def extract_keyword_frequencies(
    tweets: list[dict], top_n: int = 15
) -> dict[str, int]:
    """Return {word: count} for the *top_n* most frequent non-stopwords."""
    counter: Counter[str] = Counter()
    for t in tweets:
        words = _tokenize(t.get("text", ""))
        counter.update(w for w in words if w not in _STOPWORDS and len(w) > 1)
    return dict(counter.most_common(top_n))


def extract_hashtags(tweets: list[dict], top_n: int = 10) -> list[str]:
    """Return most frequent hashtags (without #)."""
    counter: Counter[str] = Counter()
    for t in tweets:
        tags = re.findall(r"#(\w+)", t.get("text", ""))
        counter.update(tag.lower() for tag in tags)
    return [tag for tag, _ in counter.most_common(top_n)]


def extract_emojis(tweets: list[dict], top_n: int = 10) -> list[str]:
    """Return most frequent emoji characters."""
    emoji_pattern = re.compile(
        "[\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"  # dingbats
        "\U000024C2-\U0001F251"  # misc
        "]+", flags=re.UNICODE
    )
    counter: Counter[str] = Counter()
    for t in tweets:
        counter.update(emoji_pattern.findall(t.get("text", "")))
    return [e for e, _ in counter.most_common(top_n)]


def detect_cta_patterns(tweets: list[dict]) -> dict[str, int]:
    """Count CTA patterns found across tweets."""
    counts: dict[str, int] = {}
    for t in tweets:
        text = t.get("text", "").lower()
        for pattern, label in _CTA_PATTERNS:
            if re.search(pattern, text):
                counts[label] = counts.get(label, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: x[1], reverse=True))


# ---------------------------------------------------------------------------
# internal helpers
# ---------------------------------------------------------------------------


def _tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return text.split()


def _safe_avg(tweets: list[dict], key: str) -> float:
    vals = [t.get(key, 0) for t in tweets]
    return sum(vals) / len(vals) if vals else 0.0


def _avg_text_length(tweets: list[dict]) -> float:
    lengths = [len(t.get("text", "")) for t in tweets]
    return sum(lengths) / len(lengths) if lengths else 0.0


def _question_ratio(tweets: list[dict]) -> float:
    if not tweets:
        return 0.0
    questions = sum(1 for t in tweets if "?" in t.get("text", ""))
    return questions / len(tweets)
