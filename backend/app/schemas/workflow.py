"""Workflow execution schemas."""
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime, UTC

from .content import ContentAsset, ContentPillar
from .tiktok import TikTokPack


class WorkflowStatus(str, Enum):
    """Workflow run status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentTrace(BaseModel):
    """Trace of an agent step."""

    agent: str = Field(description="Agent name.")
    step: str = Field(description="Step name.")
    input_summary: str = Field(description="Summary of inputs.")
    output_summary: str = Field(description="Summary of outputs.")
    duration_ms: int = Field(default=0, description="Duration in milliseconds.")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), description="When the step ran.")


class WorkflowRun(BaseModel):
    """Result of a workflow execution."""

    run_id: str = Field(description="Unique run identifier.")
    workflow_type: str = Field(description="Type of workflow (e.g. weekly-content-plan).")
    status: WorkflowStatus = Field(description="Current status.")
    brand_handle: str = Field(description="Brand handle associated.")
    pillars: list[ContentPillar] = Field(default_factory=list, description="Planned pillars.")
    assets: list[ContentAsset] = Field(default_factory=list, description="Produced assets.")
    tiktok_packs: list[TikTokPack] = Field(default_factory=list, description="TikTok packs.")
    traces: list[AgentTrace] = Field(default_factory=list, description="Execution traces.")
    started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
