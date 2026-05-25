"""Tests for AgentEvaluator — heuristic evaluation against golden examples."""
from __future__ import annotations

from app.agents.contracts import EditorIssue, EditorReview, WeeklyStrategy
from app.evaluation.evaluator import AgentEvaluator, EvalResult
from app.schemas.content import ContentAsset, ContentIdea, ContentPillar, Platform


# ---------------------------------------------------------------------------
# Strategist evaluation
# ---------------------------------------------------------------------------

def test_eval_strategist_pass():
    """A well-formed WeeklyStrategy should pass evaluation."""
    strategy = WeeklyStrategy(
        narrative="Test narrative for the week.",
        pillars=[
            ContentPillar(name="P1", description="Desc", platforms=[Platform.X]),
        ],
        ideas=[
            ContentIdea(title="Idea 1", hook="Hook", angle="Angle", platform=Platform.X, format="post", pillar="P1"),
        ],
        platform_distribution={"x": ["Idea 1"]},
    )
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("strategist", strategy, example_index=0)

    assert isinstance(result, EvalResult)
    assert result.passed is True
    assert result.score >= 0.7


def test_eval_strategist_fail_empty():
    """An empty object should fail strategist evaluation."""
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("strategist", object(), example_index=0)

    assert result.passed is False
    assert result.score < 0.7


# ---------------------------------------------------------------------------
# Writer evaluation
# ---------------------------------------------------------------------------

def test_eval_writer_pass():
    """A ContentAsset with sufficient body should pass writer evaluation."""
    asset = ContentAsset(
        id="asset-test",
        idea_id="idea-0",
        platform=Platform.X,
        format="thread",
        body="x" * 100,  # > 50 chars
        status="draft",
    )
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("writer", asset, example_index=0)

    assert isinstance(result, EvalResult)
    assert result.passed is True
    assert result.score >= 0.7


def test_eval_writer_fail_short_body():
    """A ContentAsset with very short body should fail writer evaluation."""
    asset = ContentAsset(
        id="asset-short",
        idea_id="idea-0",
        platform=Platform.X,
        format="thread",
        body="short",  # < 50 chars
        status="draft",
    )
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("writer", asset, example_index=0)

    assert result.score < 0.7  # body_length check fails


# ---------------------------------------------------------------------------
# Editor evaluation
# ---------------------------------------------------------------------------

def test_eval_editor_pass():
    """An approved EditorReview should pass editor evaluation."""
    review = EditorReview(
        approved=True,
        issues=[],
        revised_asset=None,
        voice_fit_score=0.9,
    )
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("editor", review, example_index=0)

    assert isinstance(result, EvalResult)
    assert result.passed is True
    assert result.score >= 0.7


def test_eval_editor_with_issues():
    """An EditorReview with issues against the 'with issues' golden example."""
    review = EditorReview(
        approved=False,
        issues=[
            EditorIssue(category="ai_slop", severity="medium", description="Generic", suggestion="Fix"),
        ],
        revised_asset=None,
        voice_fit_score=0.5,
    )
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("editor", review, example_index=1)

    assert isinstance(result, EvalResult)
    # approved matches expected (False), issues present, score valid
    assert result.score >= 0.7


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_eval_unknown_agent():
    """Unknown agent_id should return passed=False."""
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("nonexistent", object(), example_index=0)

    assert result.passed is False
    assert result.score == 0.0
    assert "nonexistent" in result.details


def test_eval_missing_example_index():
    """Out-of-range example_index should return passed=False."""
    evaluator = AgentEvaluator()
    result = evaluator.evaluate("strategist", object(), example_index=999)

    assert result.passed is False
    assert result.score == 0.0
