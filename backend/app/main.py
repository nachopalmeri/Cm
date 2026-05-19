"""FastAPI application entrypoint."""
import logging

from fastapi import FastAPI

from app.config import settings
from app.schemas.api import WeeklyContentPlanRequest, WeeklyContentPlanResponse
from app.workflows.weekly import enrich_brief_from_social, run_weekly_content_plan

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def healthcheck() -> dict:
    """Liveness probe."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.post("/workflows/weekly-content-plan", response_model=WeeklyContentPlanResponse, tags=["workflows"])
def weekly_content_plan(request: WeeklyContentPlanRequest) -> WeeklyContentPlanResponse:
    """Run the weekly content planning workflow synchronously.

    Accepts a weekly brief and brand profile, returns a completed workflow run
    with planned pillars, content assets and execution traces.

    If *social_sources* is provided with a twitter_handle and/or substack_url,
    the brief is automatically enriched with real social input analysis before
    the workflow runs.
    """
    brief = request.brief
    if request.social_sources and (
        request.social_sources.twitter_handle
        or request.social_sources.substack_url
    ):
        try:
            brief = enrich_brief_from_social(
                brief=request.brief,
                brand=request.brand_profile,
                social_sources=request.social_sources,
            )
        except Exception:
            logger.exception("Social enrichment failed, continuing with original brief")

    workflow_run = run_weekly_content_plan(
        brief=brief,
        brand=request.brand_profile,
    )
    return WeeklyContentPlanResponse(workflow_run=workflow_run)
