"""Tests for GOLDEN_EXAMPLES — structure, integrity, and no app.models imports."""
from __future__ import annotations

import ast
import importlib
from pathlib import Path

import pytest

from app.agents.contracts import EditorIssue, EditorReview, WeeklyStrategy
from app.evaluation.golden_examples import GOLDEN_EXAMPLES
from app.schemas.content import ContentAsset, ContentIdea, ContentPillar, Platform
from app.schemas.memory import MemoryItem


# ---------------------------------------------------------------------------
# Structure checks
# ---------------------------------------------------------------------------

def test_golden_examples_has_all_agents():
    """GOLDEN_EXAMPLES must contain entries for strategist, writer, editor."""
    for agent_id in ("strategist", "writer", "editor"):
        assert agent_id in GOLDEN_EXAMPLES, f"Missing agent: {agent_id}"
        assert len(GOLDEN_EXAMPLES[agent_id]) >= 1, f"No examples for {agent_id}"


def test_strategist_example_structure():
    """Strategist golden example has valid input keys and expected type."""
    examples = GOLDEN_EXAMPLES["strategist"]
    ex = examples[0]

    assert "input" in ex
    assert "expected" in ex

    inp = ex["input"]
    assert "brand_profile" in inp
    assert "weekly_brief" in inp
    assert "memory_context" in inp

    expected = ex["expected"]
    assert isinstance(expected, WeeklyStrategy)
    assert len(expected.pillars) >= 1
    assert len(expected.ideas) >= 1
    assert expected.narrative  # non-empty


def test_writer_example_structure():
    """Writer golden example has valid input keys and expected type."""
    examples = GOLDEN_EXAMPLES["writer"]
    ex = examples[0]

    assert "input" in ex
    assert "expected" in ex

    inp = ex["input"]
    assert "brand_profile" in inp
    assert "strategy" in inp
    assert "target_platform" in inp
    assert "idea_index" in inp

    expected = ex["expected"]
    assert isinstance(expected, ContentAsset)
    assert expected.body  # non-empty body
    assert len(expected.body) > 50


def test_editor_examples_structure():
    """Editor golden examples (2) have valid input keys and expected types."""
    examples = GOLDEN_EXAMPLES["editor"]
    assert len(examples) >= 2, "Editor should have at least 2 examples (approved + with issues)"

    for ex in examples:
        assert "input" in ex
        assert "expected" in ex

        inp = ex["input"]
        assert "brand_profile" in inp
        assert "asset" in inp

        expected = ex["expected"]
        assert isinstance(expected, EditorReview)

    # First example: approved
    assert examples[0]["expected"].approved is True
    # Second example: not approved
    assert examples[1]["expected"].approved is False
    assert len(examples[1]["expected"].issues) >= 1


# ---------------------------------------------------------------------------
# Integrity: golden data is self-consistent
# ---------------------------------------------------------------------------

def test_strategist_ideas_reference_valid_pillars():
    """Each idea.pillar must match a pillar name in the same strategy."""
    ex = GOLDEN_EXAMPLES["strategist"][0]
    strategy: WeeklyStrategy = ex["expected"]
    pillar_names = {p.name for p in strategy.pillars}

    for idea in strategy.ideas:
        assert idea.pillar in pillar_names, f"Idea '{idea.title}' references unknown pillar '{idea.pillar}'"


def test_writer_golden_platform_matches_idea():
    """Writer golden asset platform should match the target_platform input."""
    ex = GOLDEN_EXAMPLES["writer"][0]
    assert ex["expected"].platform == ex["input"]["target_platform"]


# ---------------------------------------------------------------------------
# No app.models import
# ---------------------------------------------------------------------------

def test_golden_examples_no_app_models_import():
    """golden_examples.py must not import from app.models."""
    module_path = Path(__file__).resolve().parent.parent.parent / "app" / "evaluation" / "golden_examples.py"
    source = module_path.read_text(encoding="utf-8")
    tree = ast.parse(source)

    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            assert node.module != "app.models", "golden_examples.py must not import app.models"
            if node.module and node.module.startswith("app.models"):
                pytest.fail(f"golden_examples.py imports from {node.module}")
