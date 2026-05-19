"""API request/response schemas."""
from pydantic import BaseModel

from .brand import BrandProfile
from .brief import WeeklyBrief
from .workflow import WorkflowRun


class SocialSources(BaseModel):
    """Optional social media handles for automatic brief enrichment."""

    twitter_handle: str | None = None
    substack_url: str | None = None


class WeeklyContentPlanRequest(BaseModel):
    """Request body for POST /workflows/weekly-content-plan."""

    brief: WeeklyBrief
    brand_profile: BrandProfile
    social_sources: SocialSources | None = None


class WeeklyContentPlanResponse(BaseModel):
    """Response body for POST /workflows/weekly-content-plan."""

    workflow_run: WorkflowRun
