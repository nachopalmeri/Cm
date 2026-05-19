"""Writer Agent — produces content assets from strategy ideas."""
from __future__ import annotations

import time
import uuid
from datetime import datetime, UTC

from app.agents.contracts import WriterInput, WriterOutput
from app.agents.llm import LLMProvider
from app.prompts.registry import PromptRegistry
from app.schemas.content import ContentAsset
from app.schemas.workflow import AgentTrace


class WriterAgent:
    """Produces a ContentAsset from a strategy idea and brand profile."""

    agent_id: str = "writer"
    agent_version: str = "0.1.0"

    def __init__(self, llm: LLMProvider, registry: PromptRegistry) -> None:
        self._llm = llm
        self._registry = registry

    async def run(self, input: WriterInput) -> WriterOutput:
        """Generate a content asset from a strategy idea."""
        start = time.monotonic()
        prompt = self._registry.get_prompt(self.agent_id)

        brand = input.brand_profile
        idea = input.strategy.ideas[input.idea_index]
        memory_text = self._format_memory(input.memory_context)

        user_rendered = prompt.render_user(
            brand_name=brand.name,
            brand_voice=brand.voice,
            brand_tone=brand.tone,
            brand_style=brand.style,
            brand_forbidden=", ".join(brand.forbidden_topics),
            idea_title=idea.title,
            idea_hook=idea.hook,
            idea_angle=idea.angle,
            idea_format=idea.format,
            target_platform=input.target_platform.value,
            pillar_name=idea.pillar,
            memory_context=memory_text,
        )

        llm_response = await self._llm.generate(
            system=prompt.system_prompt,
            user=user_rendered,
        )

        asset = ContentAsset(
            id=f"asset-{uuid.uuid4().hex[:8]}",
            idea_id=f"idea-{input.idea_index}",
            platform=input.target_platform,
            format=idea.format,
            body=llm_response.content,
            status="draft",
            notes="",
        )

        elapsed_ms = int((time.monotonic() - start) * 1000)

        trace = AgentTrace(
            agent=self.agent_id,
            step="generate_asset",
            input_summary=f"Idea: {idea.title}, Platform: {input.target_platform.value}",
            output_summary=f"Asset: {asset.id}, {len(asset.body)} chars",
            duration_ms=elapsed_ms,
            timestamp=datetime.now(UTC),
        )

        return WriterOutput(content=asset, trace=trace, metadata={
            "prompt_version": prompt.id,
            "llm_model": llm_response.model_name,
            "prompt_tokens": llm_response.prompt_tokens,
            "completion_tokens": llm_response.completion_tokens,
        })

    def _format_memory(self, items: list) -> str:
        if not items:
            return "No prior memory available."
        return "\n".join(f"- [{m.memory_type.value}] {m.key}: {m.value}" for m in items)
