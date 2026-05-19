"""Orchestrator Agent — coordinates Strategist → Writer → Editor pipeline."""
from __future__ import annotations

import time
import uuid
from datetime import datetime, UTC

from app.agents.contracts import (
    AgentInput,
    EditorInput,
    StrategistInput,
    StrategistOutput,
    WeeklyStrategy,
    WriterInput,
    WriterOutput,
)
from app.agents.editor import EditorAgent
from app.agents.llm import LLMProvider
from app.agents.strategist import StrategistAgent
from app.agents.writer import WriterAgent
from app.prompts.registry import PromptRegistry
from app.schemas.content import ContentAsset
from app.schemas.workflow import AgentTrace, WorkflowRun, WorkflowStatus
from app.workflows.tiktok_packs import TikTokPackGenerator


_MAX_REWRITE_LOOPS = 3


class OrchestratorAgent:
    """Coordinates the weekly content plan pipeline.

    Flow:
    1. Strategist → WeeklyStrategy
    2. For each idea → Writer → ContentAsset
    3. For each asset → Editor → EditorReview
    4. If rejected, re-run Writer with feedback (up to MAX_REWRITE_LOOPS)
    5. Assemble WorkflowRun with all traces and assets
    """

    agent_id: str = "orchestrator"
    agent_version: str = "0.1.0"

    def __init__(self, llm: LLMProvider, registry: PromptRegistry) -> None:
        self._llm = llm
        self._registry = registry
        self._strategist = StrategistAgent(llm, registry)
        self._writer = WriterAgent(llm, registry)
        self._editor = EditorAgent(llm, registry)
        self._tiktok_generator = TikTokPackGenerator(llm, registry)

    async def run(self, input: AgentInput) -> WorkflowRun:
        """Execute the full weekly content plan pipeline."""
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        traces: list[AgentTrace] = []
        assets: list[ContentAsset] = []
        start = time.monotonic()

        # --- Step 1: Strategist ---
        strategist_input = StrategistInput(
            brand_profile=input.brand_profile,
            weekly_brief=input.weekly_brief,
            memory_context=input.memory_context,
            previous_outputs=input.previous_outputs,
        )

        strategist_output: StrategistOutput = await self._strategist.run(strategist_input)
        traces.append(strategist_output.trace)
        strategy = strategist_output.content

        # --- Step 2 & 3: Writer + Editor for each idea ---
        for idx, idea in enumerate(strategy.ideas):
            asset, editor_traces = await self._produce_asset(
                input=input,
                strategy=strategy,
                idea_index=idx,
            )
            assets.append(asset)
            traces.extend(editor_traces)

        # --- Step 4: TikTok Pack generation ---
        tiktok_packs, tiktok_traces = await self._tiktok_generator.generate_packs(
            assets=assets,
            brand_name=input.brand_profile.name,
            brand_voice=input.brand_profile.voice,
            brand_tone=input.brand_profile.tone,
            brand_forbidden=input.brand_profile.forbidden_topics,
        )
        traces.extend(tiktok_traces)

        elapsed_ms = int((time.monotonic() - start) * 1000)

        return WorkflowRun(
            run_id=run_id,
            workflow_type="weekly-content-plan",
            status=WorkflowStatus.COMPLETED,
            brand_handle=input.brand_profile.handle,
            pillars=strategy.pillars,
            assets=assets,
            tiktok_packs=tiktok_packs,
            traces=traces,
            started_at=datetime.now(UTC),
            completed_at=datetime.now(UTC),
        )

    async def _produce_asset(
        self,
        input: AgentInput,
        strategy: WeeklyStrategy,
        idea_index: int,
    ) -> tuple[ContentAsset, list[AgentTrace]]:
        """Run Writer + Editor loop for a single idea. Returns (final_asset, traces)."""
        traces: list[AgentTrace] = []
        idea = strategy.ideas[idea_index]
        current_asset: ContentAsset | None = None
        feedback = ""

        for attempt in range(_MAX_REWRITE_LOOPS + 1):
            # --- Writer ---
            writer_input = WriterInput(
                brand_profile=input.brand_profile,
                weekly_brief=input.weekly_brief,
                memory_context=input.memory_context,
                previous_outputs=input.previous_outputs,
                strategy=strategy,
                target_platform=idea.platform,
                idea_index=idea_index,
            )

            writer_output: WriterOutput = await self._writer.run(writer_input)
            traces.append(writer_output.trace)
            current_asset = writer_output.content

            # If rewrite, append feedback to notes
            if feedback and current_asset:
                current_asset.notes = f"Rewrite attempt {attempt}. Feedback: {feedback}"

            # --- Editor ---
            editor_input = EditorInput(
                brand_profile=input.brand_profile,
                weekly_brief=input.weekly_brief,
                memory_context=input.memory_context,
                previous_outputs=input.previous_outputs,
                asset=current_asset,
            )

            editor_output = await self._editor.run(editor_input)
            traces.append(editor_output.trace)
            review = editor_output.content

            if review.approved:
                # Use revised asset if editor provided one
                if review.revised_asset:
                    current_asset = review.revised_asset
                current_asset.status = "approved"
                break

            # Not approved — prepare feedback for rewrite
            feedback = "; ".join(
                f"{i.category}: {i.suggestion}" for i in review.issues if i.suggestion
            )

            # Use revised asset as starting point if available
            if review.revised_asset:
                current_asset = review.revised_asset

        else:
            # Exhausted rewrite loops
            if current_asset:
                current_asset.status = "failed"
                current_asset.notes = f"Failed after {_MAX_REWRITE_LOOPS} rewrite attempts."

        return current_asset, traces
