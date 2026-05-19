"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from importlib.metadata import version as pkg_version

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.schemas.api import WeeklyContentPlanRequest, WeeklyContentPlanResponse
from app.workflows.weekly import enrich_brief_from_social, run_weekly_content_plan

logger = logging.getLogger(__name__)


def _get_app_version() -> str:
    """Read version from package metadata, falling back to settings."""
    try:
        return pkg_version("social-ai-os")
    except Exception:
        return "0.6.1"


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version=_get_app_version(),
)

# CORS middleware
_allowed_origins = [
    origin.strip()
    for origin in settings.ALLOWED_ORIGINS.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def healthcheck() -> dict:
    """Liveness probe."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/ready", tags=["health"])
def ready_check() -> dict:
    """Readiness probe — verifies DB connectivity when DATABASE_URL is set."""
    db_url = settings.DATABASE_URL
    if not db_url:
        return {"status": "ready", "db": "not_configured"}

    try:
        from sqlalchemy import create_engine

        engine = create_engine(db_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "db": "ok"}
    except Exception as exc:
        logger.error("Readiness check failed: %s", exc)
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "db": str(exc)},
        )


@app.post("/workflows/weekly-content-plan", response_model=WeeklyContentPlanResponse, tags=["workflows"])
async def weekly_content_plan(request: WeeklyContentPlanRequest) -> WeeklyContentPlanResponse:
    """Run the weekly content planning workflow asynchronously.

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
            brief = await enrich_brief_from_social(
                brief=request.brief,
                brand=request.brand_profile,
                social_sources=request.social_sources,
            )
        except Exception:
            logger.exception("Social enrichment failed, continuing with original brief")

    workflow_run = await run_weekly_content_plan(
        brief=brief,
        brand=request.brand_profile,
    )
    return WeeklyContentPlanResponse(workflow_run=workflow_run)
