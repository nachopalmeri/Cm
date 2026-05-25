"""Substack RSS client — public feed, no auth required."""
from __future__ import annotations

import ipaddress
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

import feedparser
import httpx

logger = logging.getLogger(__name__)


@dataclass
class ManualPostInput:
    """User-provided posts when RSS is unavailable."""
    posts: list[dict] = field(default_factory=list)


class SubstackClient:
    """Reads a Substack publication's public RSS feed.

    No authentication needed — Substack RSS is always public.
    """

    # ------------------------------------------------------------------
    # public
    # ------------------------------------------------------------------

    async def fetch_posts(self, substack_url: str) -> list[dict]:
        """Fetch recent posts from a Substack RSS feed.

        *substack_url* can be the full publication URL or the feed URL.
        Returns a list of normalized dicts with keys:
            title, summary, published, link, categories
        """
        self._validate_host(substack_url)
        feed_url = self._build_feed_url(substack_url)

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(feed_url)
                resp.raise_for_status()
                feed = feedparser.parse(resp.text)
        except httpx.HTTPError as exc:
            logger.error("Substack RSS request failed: %s", exc)
            return []
        except Exception as exc:
            logger.error("Substack RSS parse failed: %s", exc)
            return []

        if feed.bozo and not feed.entries:
            logger.warning("Substack feed is malformed: %s", feed.bozo_exception)
            return []

        return self._parse_entries(feed.entries)

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_host(url: str) -> None:
        """Validate URL host to prevent SSRF.

        Rejects:
        - Non-HTTP(S) schemes
        - localhost / loopback addresses
        - Private IP ranges (10.x, 172.16-31, 192.168.x, 169.254.x)
        """
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Invalid URL scheme: {parsed.scheme}")

        hostname = parsed.hostname
        if not hostname:
            raise ValueError("URL has no valid hostname")

        host_lower = hostname.lower()
        if host_lower in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            raise ValueError(f"Host not allowed: {hostname}")

        try:
            addr = ipaddress.ip_address(hostname)
        except ValueError:
            return

        if addr.is_private or addr.is_loopback or addr.is_link_local:
            raise ValueError(f"Host not allowed: {hostname}")

    @staticmethod
    def _build_feed_url(url: str) -> str:
        url = url.rstrip("/")
        if url.endswith("/feed"):
            return url
        return f"{url}/feed"

    @staticmethod
    def _parse_entries(entries: list) -> list[dict]:
        posts: list[dict] = []
        for entry in entries:
            published = ""
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    published = datetime(
                        *entry.published_parsed[:6], tzinfo=timezone.utc
                    ).isoformat()
                except (TypeError, ValueError):
                    pass

            categories = []
            if hasattr(entry, "tags"):
                categories = [
                    t.term for t in entry.tags if hasattr(t, "term")
                ]

            posts.append({
                "title": getattr(entry, "title", ""),
                "summary": getattr(entry, "summary", ""),
                "published": published,
                "link": getattr(entry, "link", ""),
                "categories": categories,
            })
        return posts
