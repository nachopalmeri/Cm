"""Pexels API wrapper for stock video search — with fallback when key is missing."""
from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

PEXELS_BASE = "https://api.pexels.com/videos"


class StockVideoProvider:
    """Search Pexels for stock video clips by keyword.

    Falls back to None when PEXELS_API_KEY is not configured, so the
    video composer can use a solid-colour background instead.
    """

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or settings.PEXELS_API_KEY

    async def search_video(self, keyword: str) -> str | None:
        """Return a direct video URL for *keyword*, or None on failure / no key.

        Args:
            keyword: Search term (e.g. pack title or hook).

        Returns:
            A direct .mp4 download URL, or None.
        """
        if not self._api_key:
            logger.info("PEXELS_API_KEY not set — using fallback background.")
            return None

        headers = {"Authorization": self._api_key}
        params = {"query": keyword, "per_page": 1, "orientation": "portrait"}

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(PEXELS_BASE, headers=headers, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.warning("Pexels API request failed: %s", exc)
            return None

        videos = data.get("videos", [])
        if not videos:
            logger.info("No Pexels results for keyword=%r", keyword)
            return None

        # Pick the smallest HD file (portrait orientation)
        video_files = videos[0].get("video_files", [])
        best = None
        for vf in video_files:
            if vf.get("width", 0) >= 720 and vf.get("height", 0) >= 720:
                if best is None or vf.get("width", 9999) < best.get("width", 9999):
                    best = vf

        if best is None and video_files:
            best = video_files[-1]  # fallback: last (usually highest quality)

        url = best.get("link") if best else None
        if url:
            logger.info("Pexels match for %r → %s", keyword, url[:80])
        return url
