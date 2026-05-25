"""Twitter/X API v2 client with manual fallback."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

X_API_BASE = "https://api.twitter.com/2"


@dataclass
class ManualTweetInput:
    """User-provided tweets when API is unavailable."""
    tweets: list[dict] = field(default_factory=list)


class TwitterClient:
    """Minimal X API v2 client for reading recent tweets.

    Uses bearer token from X_API_BEARER_TOKEN env var.
    Falls back to empty results when token is missing — caller should
    use ManualTweetInput instead.
    """

    def __init__(self, bearer_token: str | None = None) -> None:
        self._token = bearer_token or settings.X_API_BEARER_TOKEN

    # ------------------------------------------------------------------
    # public
    # ------------------------------------------------------------------

    async def fetch_recent_tweets(
        self, handle: str, max_results: int = 20
    ) -> list[dict]:
        """Fetch recent tweets for *handle* via X API v2.

        Returns a list of normalized dicts with keys:
            id, text, created_at, likes, retweets, replies
        """
        if not self._token:
            logger.warning("X_API_BEARER_TOKEN not set — returning empty tweet list")
            return []

        clean_handle = handle.lstrip("@")
        url = f"{X_API_BASE}/tweets/search/recent"
        headers = {"Authorization": f"Bearer {self._token}"}
        params = {
            "query": f"from:{clean_handle}",
            "max_results": min(max_results, 100),
            "tweet.fields": "created_at,public_metrics",
            "expansions": "author_id",
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, headers=headers, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            logger.error("X API request failed: %s", exc)
            return []

        return self._parse_response(data)

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------

    def _parse_response(self, data: dict) -> list[dict]:
        tweets = []
        for t in data.get("data", []):
            metrics = t.get("public_metrics", {})
            tweets.append({
                "id": t.get("id", ""),
                "text": t.get("text", ""),
                "created_at": t.get("created_at", ""),
                "likes": metrics.get("like_count", 0),
                "retweets": metrics.get("retweet_count", 0),
                "replies": metrics.get("reply_count", 0),
            })
        return tweets
