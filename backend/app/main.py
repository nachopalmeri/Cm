"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
import uuid
from importlib.metadata import version as pkg_version

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db.base import Base
from app.schemas.api import (
    FeedbackRequest,
    FeedbackResponse,
    GenerateRequest,
    GenerateResponse,
    IngestRequest,
    IngestResponse,
    VoiceProfileResponse,
    WeeklyContentPlanRequest,
    WeeklyContentPlanResponse,
)
from app.workflows.weekly import enrich_brief_from_social, run_weekly_content_plan

logger = logging.getLogger(__name__)


def _get_app_version() -> str:
    """Read version from package metadata, falling back to settings."""
    try:
        return pkg_version("social-ai-os")
    except Exception:
        return "0.7.1"


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


def _get_db_session():
    """Create a SQLite session for local dev / tests."""
    db_url = settings.DATABASE_URL or "sqlite:///./ghostwriter.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


@app.get("/health", tags=["health"])
def healthcheck() -> dict:
    """Liveness probe."""
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/ready", tags=["health"])
def ready_check() -> dict:
    """Readiness probe - verifies DB connectivity when DATABASE_URL is set."""
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
    """Run the weekly content planning workflow asynchronously."""
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


# ---------------------------------------------------------------------------
# Ghostwriter endpoints
# ---------------------------------------------------------------------------

@app.post("/ghostwriter/ingest", response_model=IngestResponse, tags=["ghostwriter"])
async def ghostwriter_ingest(request: IngestRequest) -> IngestResponse:
    """Ingest raw content samples into BrandMemory to build the voice profile."""
    from app.ghostwriter.service import GhostwriterService

    session = _get_db_session()
    try:
        svc = GhostwriterService(session)
        return await svc.ingest(
            texts=request.texts,
            source=request.source,
            brand_profile=request.brand_profile,
        )
    finally:
        session.close()


@app.get("/ghostwriter/profile", response_model=VoiceProfileResponse, tags=["ghostwriter"])
async def ghostwriter_profile(
    brand_id: uuid.UUID = Query(..., description="Brand profile UUID"),
) -> VoiceProfileResponse:
    """Return the aggregated voice profile built from stored BrandMemory."""
    from app.ghostwriter.service import GhostwriterService

    session = _get_db_session()
    try:
        svc = GhostwriterService(session)
        return await svc.get_profile(brand_profile_id=brand_id)
    finally:
        session.close()


@app.post("/ghostwriter/generate", response_model=GenerateResponse, tags=["ghostwriter"])
async def ghostwriter_generate(request: GenerateRequest) -> GenerateResponse:
    """Generate content drafts that match the user voice profile."""
    from app.ghostwriter.service import GhostwriterService

    session = _get_db_session()
    try:
        svc = GhostwriterService(session)
        return await svc.generate(
            topic=request.topic,
            platform=request.platform,
            count=request.count,
            brand_profile=request.brand_profile,
        )
    finally:
        session.close()


@app.post("/ghostwriter/feedback", response_model=FeedbackResponse, tags=["ghostwriter"])
async def ghostwriter_feedback(request: FeedbackRequest) -> FeedbackResponse:
    """Store approval/rejection feedback and update BrandMemory with diff analysis."""
    from app.ghostwriter.service import GhostwriterService

    session = _get_db_session()
    try:
        svc = GhostwriterService(session)
        return await svc.feedback(
            draft_id=request.draft_id,
            draft_text=request.draft_text,
            approved=request.approved,
            correction=request.correction,
            brand_profile_id=request.brand_profile_id,
        )
    finally:
        session.close()
