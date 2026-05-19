"""Editor Agent — reviews content assets for quality and brand fit."""
from __future__ import annotations

import json
import time
from datetime import datetime, UTC

from app.agents.contracts import EditorInput, EditorIssue, EditorOutput, EditorReview
from app.agents.llm import LLMProvider
from app.prompts.registry import PromptRegistry
from app.schemas.content import ContentAsset
from app.schemas.workflow import AgentTrace


class EditorAgent:
    """Reviews a ContentAsset for clarity, authenticity, voice fit, and risk."""

    agent_id: str = "editor"
    agent_version: str = "0.1.0"

    def __init__(self, llm: LLMProvider, registry: PromptRegistry) -> None:
        self._llm = llm
        self._registry = registry

    async def run(self, input: EditorInput) -> EditorOutput:
        """Review a content asset and produce an EditorReview."""
        start = time.monotonic()
        prompt = self._registry.get_prompt(self.agent_id)

        brand = input.brand_profile
        asset = input.asset
        memory_text = self._format_memory(input.memory_context)

        user_rendered = prompt.render_user(
            brand_name=brand.name,
            brand_voice=brand.voice,
            brand_tone=brand.tone,
            brand_forbidden=", ".join(brand.forbidden_topics),
            asset_body=asset.body,
            asset_platform=asset.platform.value,
            asset_format=asset.format,
            memory_context=memory_text,
        )

        llm_response = await self._llm.generate(
            system=prompt.system_prompt,
            user=user_rendered,
        )

        review = self._parse_review(llm_response.content, asset)

        elapsed_ms = int((time.monotonic() - start) * 1000)

        trace = AgentTrace(
            agent=self.agent_id,
            step="review_asset",
            input_summary=f"Asset: {asset.id}, Platform: {asset.platform.value}",
            output_summary=f"Approved: {review.approved}, Score: {review.voice_fit_score}, Issues: {len(review.issues)}",
            duration_ms=elapsed_ms,
            timestamp=datetime.now(UTC),
        )

        return EditorOutput(content=review, trace=trace, metadata={
            "prompt_version": prompt.id,
            "llm_model": llm_response.model_name,
            "prompt_tokens": llm_response.prompt_tokens,
            "completion_tokens": llm_response.completion_tokens,
        })

    def _format_memory(self, items: list) -> str:
        if not items:
            return "No prior content memory available."
        return "\n".join(f"- [{m.memory_type.value}] {m.key}: {m.value}" for m in items)

    def _parse_review(self, raw: str, original: ContentAsset) -> EditorReview:
        """Parse LLM JSON output into an EditorReview model."""
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # If parsing fails, return a permissive review
            return EditorReview(
                approved=True,
                issues=[],
                revised_asset=None,
                voice_fit_score=0.5,
            )

        issues = [
            EditorIssue(
                category=i.get("category", "clarity"),
                severity=i.get("severity", "low"),
                description=i.get("description", ""),
                suggestion=i.get("suggestion", ""),
            )
            for i in data.get("issues", [])
        ]

        revised = None
        if data.get("revised_asset") and isinstance(data["revised_asset"], dict):
            ra = data["revised_asset"]
            revised = ContentAsset(
                id=original.id,
                idea_id=original.idea_id,
                platform=original.platform,
                format=original.format,
                body=ra.get("body", original.body),
                status="draft",
                notes=ra.get("notes", "Editor revised."),
            )

        return EditorReview(
            approved=data.get("approved", False),
            issues=issues,
            revised_asset=revised,
            voice_fit_score=data.get("voice_fit_score", 0.5),
        )
