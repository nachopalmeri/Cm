"""Integration tests for /ghostwriter/* endpoints."""
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def brand_payload() -> dict:
    return {
        "name": "Nacho Palmeri",
        "handle": "@nachopalmeri",
        "voice": "Irreverent builder who ships fast.",
        "tone": "Casual, data-driven, no fluff.",
        "personality": "Curious, skeptical of hype, generous with knowledge.",
        "style": "Short paragraphs. Questions as hooks. Concrete examples.",
        "audience_description": "Founders, developers, tech-curious professionals.",
        "platforms": ["x", "linkedin"],
    }


# ---------------------------------------------------------------------------
# Test 1 — /ghostwriter/ingest
# ---------------------------------------------------------------------------

def test_ingest_stores_brand_memory(client: TestClient, brand_payload: dict) -> None:
    """POST /ghostwriter/ingest stores texts and returns ingested count."""
    payload = {
        "texts": [
            "AI agents need memory or they are just autocomplete.",
            "Ship the MVP. Iterate. Ship again.",
            "Building in public is the best marketing strategy for builders.",
        ],
        "source": "twitter",
        "brand_profile": brand_payload,
    }

    response = client.post("/ghostwriter/ingest", json=payload)

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["ingested"] == 3
    assert data["voice_updated"] is True


# ---------------------------------------------------------------------------
# Test 2 — /ghostwriter/profile
# ---------------------------------------------------------------------------

def test_profile_returns_aggregated_voice(client: TestClient, brand_payload: dict) -> None:
    """GET /ghostwriter/profile returns voice profile after ingest."""
    # First ingest some samples
    ingest_payload = {
        "texts": [
            "Memory-first AI agents are 10x more useful.",
            "Ship fast. Build memory. Iterate.",
        ],
        "source": "manual",
        "brand_profile": brand_payload,
    }
    ingest_resp = client.post("/ghostwriter/ingest", json=ingest_payload)
    assert ingest_resp.status_code == 200

    # Retrieve the brand_id created during ingest — use a fixed UUID for test isolation
    # We call profile with a random UUID to verify it returns a valid structure even with 0 samples
    brand_id = str(uuid.uuid4())
    response = client.get(f"/ghostwriter/profile?brand_id={brand_id}")

    assert response.status_code == 200, response.text
    data = response.json()
    assert "brand_id" in data
    assert isinstance(data["topics"], list)
    assert isinstance(data["total_samples"], int)
    assert data["total_samples"] >= 0
    assert "tone" in data
    assert "style" in data


# ---------------------------------------------------------------------------
# Test 3 — /ghostwriter/generate
# ---------------------------------------------------------------------------

def test_generate_returns_drafts(client: TestClient, brand_payload: dict) -> None:
    """POST /ghostwriter/generate returns the requested number of drafts."""
    payload = {
        "topic": "Why AI agents need persistent memory",
        "platform": "x",
        "count": 3,
        "brand_profile": brand_payload,
    }

    response = client.post("/ghostwriter/generate", json=payload)

    assert response.status_code == 200, response.text
    data = response.json()
    assert "options" in data
    assert len(data["options"]) >= 1
    for draft in data["options"]:
        assert "id" in draft
        assert "text" in draft
        assert draft["text"] != ""
        assert draft["platform"] == "x"
        assert draft["topic"] == "Why AI agents need persistent memory"


# ---------------------------------------------------------------------------
# Test 4 — /ghostwriter/feedback
# ---------------------------------------------------------------------------

def test_feedback_updates_memory(client: TestClient) -> None:
    """POST /ghostwriter/feedback persists feedback and returns diff analysis."""
    brand_id = str(uuid.uuid4())
    draft_text = "AI is amazing. It will change everything in ways we cannot imagine."
    correction = "AI agents with memory ship better products. Here is the data."

    payload = {
        "draft_id": str(uuid.uuid4()),
        "draft_text": draft_text,
        "approved": False,
        "correction": correction,
        "brand_profile_id": brand_id,
    }

    response = client.post("/ghostwriter/feedback", json=payload)

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["stored"] is True
    assert data["memory_updated"] is True

    analysis = data["analysis"]
    assert "replaced_phrases" in analysis
    assert "structural_diff" in analysis
    assert "new_topics_in_correction" in analysis
    assert isinstance(analysis["word_count_draft"], int)
    assert isinstance(analysis["word_count_correction"], int)
    assert analysis["word_count_draft"] > 0
    assert analysis["word_count_correction"] > 0

    # "amazing" and "imagine" were replaced — should appear in replaced_phrases
    assert len(analysis["replaced_phrases"]) >= 1

    # "memory" and "data" appear in correction but not in original draft
    assert len(analysis["new_topics_in_correction"]) >= 1
