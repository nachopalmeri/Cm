"""TikTok Pack Generator — produces TikTokPack outputs from approved TIKTOK assets."""
from __future__ import annotations

import json
import time
from datetime import datetime, UTC

from app.agents.llm import LLMProvider
from app.prompts.registry import PromptRegistry
from app.schemas.content import ContentAsset, Platform
from app.schemas.tiktok import TikTokPack
from app.schemas.workflow import AgentTrace


class TikTokPackGenerator:
    """Generates TikTok production packs from approved TikTok content assets.

    Not an AgentProtocol agent — a workflow-level utility that uses the same
    LLM + PromptRegistry pattern as agents, without the full agent lifecycle.
    """

    agent_id: str = "tiktok_pack"
    agent_version: str = "0.1.0"

    def __init__(self, llm: LLMProvider, registry: PromptRegistry) -> None:
        self._llm = llm
        self._registry = registry

    async def generate_packs(
        self,
        assets: list[ContentAsset],
        brand_name: str,
        brand_voice: str,
        brand_tone: str,
        brand_forbidden: list[str],
    ) -> tuple[list[TikTokPack], list[AgentTrace]]:
        """Generate TikTokPack instances for every approved TIKTOK asset.

        Returns:
            (packs, traces) where packs is a list of TikTokPack and traces
            contains one AgentTrace per generated pack.
        """
        packs: list[TikTokPack] = []
        traces: list[AgentTrace] = []

        tiktok_assets = [
            a for a in assets
            if a.platform == Platform.TIKTOK and a.status == "approved"
        ]

        for asset in tiktok_assets:
            pack, trace = await self._generate_single_pack(
                asset=asset,
                brand_name=brand_name,
                brand_voice=brand_voice,
                brand_tone=brand_tone,
                brand_forbidden=brand_forbidden,
            )
            packs.append(pack)
            traces.append(trace)

        return packs, traces

    async def _generate_single_pack(
        self,
        asset: ContentAsset,
        brand_name: str,
        brand_voice: str,
        brand_tone: str,
        brand_forbidden: list[str],
    ) -> tuple[TikTokPack, AgentTrace]:
        """Generate one TikTokPack from a single approved asset."""
        start = time.monotonic()
        prompt = self._registry.get_prompt(self.agent_id)

        user_rendered = prompt.render_user(
            brand_name=brand_name,
            brand_voice=brand_voice,
            brand_tone=brand_tone,
            brand_forbidden=", ".join(brand_forbidden),
            asset_body=asset.body,
            asset_hook=getattr(asset, "hook", ""),
            asset_platform=asset.platform.value,
            asset_format=asset.format,
            pillar_name="",
        )

        llm_response = await self._llm.generate(
            system=prompt.system_prompt,
            user=user_rendered,
        )

        pack = self._parse_pack(llm_response.content, asset)

        elapsed_ms = int((time.monotonic() - start) * 1000)

        trace = AgentTrace(
            agent=self.agent_id,
            step="generate_tiktok_pack",
            input_summary=f"Asset: {asset.id}, Platform: {asset.platform.value}",
            output_summary=f"Pack: {pack.title}, Hook: {pack.hook[:30]}...",
            duration_ms=elapsed_ms,
            timestamp=datetime.now(UTC),
        )

        return pack, trace

    def _parse_pack(self, raw: str, source_asset: ContentAsset) -> TikTokPack:
        """Parse LLM JSON output into a TikTokPack model."""
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {}

        # Build timeline safely
        timeline_raw = data.get("timeline", [])
        timeline: list[dict] = []
        if isinstance(timeline_raw, list):
            for item in timeline_raw:
                if isinstance(item, dict):
                    timeline.append({
                        "second": item.get("second", 0),
                        "action": item.get("action", ""),
                    })

        # Hashtags with fallback
        hashtags = data.get("hashtags", [])
        if not hashtags:
            hashtags = ["#BuildInPublic", "#TechTok"]

        pack = TikTokPack(
            title=data.get("title", f"TikTok Pack from {source_asset.id}"),
            hook=data.get("hook", "Check this out."),
            promise=data.get("promise", ""),
            timeline=timeline,
            visual_instructions=data.get("visual_instructions", ""),
            voiceover_script=data.get("voiceover_script", ""),
            on_screen_captions=data.get("on_screen_captions", []),
            recording_checklist=data.get("recording_checklist", []),
            cta=data.get("cta", "Follow for more."),
            hashtags=hashtags,
            repurpose_links=[source_asset.id],
        )

        return pack
