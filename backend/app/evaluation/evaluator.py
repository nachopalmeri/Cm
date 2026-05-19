"""Agent evaluator — compares agent output against golden examples."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.evaluation.golden_examples import GOLDEN_EXAMPLES


class EvalResult(BaseModel):
    """Result of evaluating a single agent output."""

    agent: str = Field(description="Agent id.")
    example_index: int = Field(description="Which golden example was used.")
    passed: bool = Field(description="Whether the output met minimum quality.")
    score: float = Field(ge=0.0, le=1.0, description="Similarity/quality score (0-1).")
    details: str = Field(default="", description="Human-readable evaluation notes.")


class AgentEvaluator:
    """Evaluates agent outputs against golden examples.

    Uses simple heuristic checks (field presence, type match, length)
    rather than semantic similarity — no external APIs needed.
    """

    def evaluate(self, agent_id: str, output: Any, example_index: int = 0) -> EvalResult:
        """Evaluate a single agent output against a golden example."""
        examples = GOLDEN_EXAMPLES.get(agent_id, [])
        if not examples or example_index >= len(examples):
            return EvalResult(
                agent=agent_id,
                example_index=example_index,
                passed=False,
                score=0.0,
                details=f"No golden example at index {example_index} for agent '{agent_id}'.",
            )

        expected = examples[example_index]["expected"]

        if agent_id == "strategist":
            return self._eval_strategist(output, expected, example_index)
        elif agent_id == "writer":
            return self._eval_writer(output, expected, example_index)
        elif agent_id == "editor":
            return self._eval_editor(output, expected, example_index)
        else:
            return EvalResult(
                agent=agent_id,
                example_index=example_index,
                passed=False,
                score=0.0,
                details=f"Unknown agent '{agent_id}'.",
            )

    def _eval_strategist(self, output: Any, expected: Any, idx: int) -> EvalResult:
        """Evaluate strategist output: check pillars, ideas, narrative."""
        checks = []
        score_parts = []

        # Narrative present and non-empty
        has_narrative = bool(getattr(output, "narrative", ""))
        checks.append(("narrative", has_narrative))
        score_parts.append(0.2 if has_narrative else 0.0)

        # At least 1 pillar
        n_pillars = len(getattr(output, "pillars", []))
        checks.append(("pillars", n_pillars >= 1))
        score_parts.append(0.3 if n_pillars >= 1 else 0.0)

        # At least 1 idea
        n_ideas = len(getattr(output, "ideas", []))
        checks.append(("ideas", n_ideas >= 1))
        score_parts.append(0.3 if n_ideas >= 1 else 0.0)

        # Platform distribution present
        has_dist = bool(getattr(output, "platform_distribution", {}))
        checks.append(("platform_distribution", has_dist))
        score_parts.append(0.2 if has_dist else 0.0)

        score = sum(score_parts)
        passed = score >= 0.7
        details = "; ".join(f"{k}: {'✓' if v else '✗'}" for k, v in checks)

        return EvalResult(agent="strategist", example_index=idx, passed=passed, score=score, details=details)

    def _eval_writer(self, output: Any, expected: Any, idx: int) -> EvalResult:
        """Evaluate writer output: check body, platform, format."""
        checks = []
        score_parts = []

        # Body non-empty and reasonable length
        body = getattr(output, "body", "")
        has_body = len(body) > 50
        checks.append(("body_length", has_body))
        score_parts.append(0.4 if has_body else 0.0)

        # Platform matches
        platform_match = getattr(output, "platform", None) == getattr(expected, "platform", None)
        checks.append(("platform", platform_match))
        score_parts.append(0.3 if platform_match else 0.0)

        # Format matches
        format_match = getattr(output, "format", None) == getattr(expected, "format", None)
        checks.append(("format", format_match))
        score_parts.append(0.3 if format_match else 0.0)

        score = sum(score_parts)
        passed = score >= 0.7
        details = "; ".join(f"{k}: {'✓' if v else '✗'}" for k, v in checks)

        return EvalResult(agent="writer", example_index=idx, passed=passed, score=score, details=details)

    def _eval_editor(self, output: Any, expected: Any, idx: int) -> EvalResult:
        """Evaluate editor output: check approval logic and voice fit."""
        checks = []
        score_parts = []

        # Has voice_fit_score
        score_val = getattr(output, "voice_fit_score", 0.0)
        has_score = 0.0 <= score_val <= 1.0
        checks.append(("voice_fit_score", has_score))
        score_parts.append(0.3 if has_score else 0.0)

        # Approved matches expected
        approved_match = getattr(output, "approved", None) == getattr(expected, "approved", None)
        checks.append(("approved_match", approved_match))
        score_parts.append(0.4 if approved_match else 0.0)

        # Issues list is present
        has_issues = isinstance(getattr(output, "issues", None), list)
        checks.append(("issues_list", has_issues))
        score_parts.append(0.3 if has_issues else 0.0)

        score = sum(score_parts)
        passed = score >= 0.7
        details = "; ".join(f"{k}: {'✓' if v else '✗'}" for k, v in checks)

        return EvalResult(agent="editor", example_index=idx, passed=passed, score=score, details=details)
