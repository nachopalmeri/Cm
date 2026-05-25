"""Strategist Agent — defines weekly narrative, pillars, and content ideas."""
from __future__ import annotations

import json
import time
import uuid
from datetime import datetime, UTC

from app.agents.contracts import StrategistInput, StrategistOutput, WeeklyStrategy
from app.agents.llm import LLMProvider
from app.prompts.registry import PromptRegistry
from app.schemas.content import ContentIdea, ContentPillar, Platform
from app.schemas.workflow import AgentTrace


class StrategistAgent:
    """Produces a WeeklyStrategy from a brief and brand profile."""

    agent_id: str = "strategist"
    agent_version: str = "0.1.0"

    def __init__(self, llm: LLMProvider, registry: PromptRegistry) -> None:
        self._llm = llm
        self._registry = registry

    async def run(self, input: StrategistInput) -> StrategistOutput:
        """Generate weekly strategy from brief and brand context."""
        start = time.monotonic()
        prompt = self._registry.get_prompt(self.agent_id)

        # Build template variables from input
        brand = input.brand_profile
        brief = input.weekly_brief
        memory_text = self._format_memory(input.memory_context)

        user_rendered = prompt.render_user(
            brand_name=brand.name,
            brand_voice=brand.voice,
            brand_tone=brand.tone,
            brand_personality=brand.personality,
            brand_opinions=", ".join(brand.opinions),
            brand_forbidden=", ".join(brand.forbidden_topics),
            themes=", ".join(brief.themes),
            projects=", ".join(brief.projects),
            learnings=", ".join(brief.learnings),
            constraints=", ".join(brief.constraints),
            objectives=", ".join(brief.objectives),
            platform_focus=", ".join(brief.platform_focus),
            memory_context=memory_text,
        )

        llm_response = await self._llm.generate(
            system=prompt.system_prompt,
            user=user_rendered,
        )

        # Parse LLM output into WeeklyStrategy
        strategy = self._parse_strategy(llm_response.content)

        elapsed_ms = int((time.monotonic() - start) * 1000)

        trace = AgentTrace(
            agent=self.agent_id,
            step="generate_strategy",
            input_summary=f"Themes: {brief.themes}",
            output_summary=f"Pillars: {len(strategy.pillars)}, Ideas: {len(strategy.ideas)}",
            duration_ms=elapsed_ms,
            timestamp=datetime.now(UTC),
        )

        return StrategistOutput(content=strategy, trace=trace, metadata={
            "prompt_version": prompt.id,
            "llm_model": llm_response.model_name,
            "prompt_tokens": llm_response.prompt_tokens,
            "completion_tokens": llm_response.completion_tokens,
        })

    def _format_memory(self, items: list) -> str:
        if not items:
            return "No prior memory available."
        return "\n".join(f"- [{m.memory_type.value}] {m.key}: {m.value}" for m in items)

    def _parse_strategy(self, raw: str) -> WeeklyStrategy:
        """Parse LLM JSON output into a WeeklyStrategy model."""
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Fallback: return a minimal strategy
            data = {
                "narrative": raw[:200],
                "pillars": [],
                "ideas": [],
                "platform_distribution": {},
            }

        pillars = [
            ContentPillar(
                name=p.get("name", "Untitled"),
                description=p.get("description", ""),
                platforms=[Platform(p) for p in p.get("platforms", [])],
            )
            for p in data.get("pillars", [])
        ]

        ideas = [
            ContentIdea(
                title=i.get("title", "Untitled"),
                hook=i.get("hook", ""),
                angle=i.get("angle", ""),
                platform=Platform(i.get("platform", "x")),
                format=i.get("format", "post"),
                pillar=i.get("pillar", ""),
            )
            for i in data.get("ideas", [])
        ]

        return WeeklyStrategy(
            narrative=data.get("narrative", ""),
            pillars=pillars,
            ideas=ideas,
            platform_distribution=data.get("platform_distribution", {}),
        )
