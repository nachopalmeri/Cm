"""Integration tests for FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.schemas.brand import BrandProfile
from app.schemas.brief import WeeklyBrief


def test_healthcheck(client: TestClient) -> None:
    """GET /health returns status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "social-ai-os"


def test_weekly_content_plan(
    client: TestClient,
    sample_brand_schema: BrandProfile,
    sample_brief_schema: WeeklyBrief,
) -> None:
    """POST /workflows/weekly-content-plan returns completed workflow run."""
    payload = {
        "brief": sample_brief_schema.model_dump(mode="json"),
        "brand_profile": sample_brand_schema.model_dump(mode="json"),
    }

    response = client.post("/workflows/weekly-content-plan", json=payload)

    assert response.status_code == 200
    data = response.json()

    # workflow_run must be present
    assert "workflow_run" in data
    run = data["workflow_run"]

    # Status
    assert run["status"] == "completed"

    # run_id present
    assert run["run_id"]
    assert isinstance(run["run_id"], str)

    # Pillars
    assert "pillars" in run
    assert isinstance(run["pillars"], list)
    assert len(run["pillars"]) > 0

    # Assets
    assert "assets" in run
    assert isinstance(run["assets"], list)
    assert len(run["assets"]) > 0

    # TikTok Packs
    assert "tiktok_packs" in run
    assert isinstance(run["tiktok_packs"], list)
    assert len(run["tiktok_packs"]) > 0

    # Traces
    assert "traces" in run
    assert isinstance(run["traces"], list)
    assert len(run["traces"]) > 0


def test_weekly_content_plan_with_social_sources(
    client: TestClient,
    sample_brand_schema: BrandProfile,
    sample_brief_schema: WeeklyBrief,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """POST with social_sources enriches brief before workflow."""
    from app.workflows import weekly as weekly_mod

    def mock_enrich(brief, brand, social_sources):
        brief.themes.append("ai_memory_from_twitter")
        brief.platform_focus.append("x")
        return brief

    monkeypatch.setattr(weekly_mod, "enrich_brief_from_social", mock_enrich)

    payload = {
        "brief": sample_brief_schema.model_dump(mode="json"),
        "brand_profile": sample_brand_schema.model_dump(mode="json"),
        "social_sources": {
            "twitter_handle": "testbuilder",
            "substack_url": "https://example.substack.com",
        },
    }

    response = client.post("/workflows/weekly-content-plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    run = data["workflow_run"]
    assert run["status"] == "completed"
    assert len(run["pillars"]) > 0
    assert len(run["assets"]) > 0


def test_weekly_content_plan_social_sources_fails_gracefully(
    client: TestClient,
    sample_brand_schema: BrandProfile,
    sample_brief_schema: WeeklyBrief,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """POST with social_sources that fails still returns completed workflow."""
    from app.workflows import weekly as weekly_mod

    def mock_enrich_fail(brief, brand, social_sources):
        raise RuntimeError("Twitter API down")

    monkeypatch.setattr(weekly_mod, "enrich_brief_from_social", mock_enrich_fail)

    payload = {
        "brief": sample_brief_schema.model_dump(mode="json"),
        "brand_profile": sample_brand_schema.model_dump(mode="json"),
        "social_sources": {
            "twitter_handle": "testbuilder",
        },
    }

    response = client.post("/workflows/weekly-content-plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    run = data["workflow_run"]
    assert run["status"] == "completed"
    assert len(run["pillars"]) > 0


def test_weekly_content_plan_without_social_sources_still_works(
    client: TestClient,
    sample_brand_schema: BrandProfile,
    sample_brief_schema: WeeklyBrief,
) -> None:
    """POST without social_sources field is backward compatible."""
    payload = {
        "brief": sample_brief_schema.model_dump(mode="json"),
        "brand_profile": sample_brand_schema.model_dump(mode="json"),
    }

    response = client.post("/workflows/weekly-content-plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    run = data["workflow_run"]
    assert run["status"] == "completed"
    assert len(run["pillars"]) > 0
