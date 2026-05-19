"""Workflow models: WorkflowRun and AgentTrace."""
import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Float, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.db.pgvector import JSONBCompat
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
from app.models.enums import WorkflowStatus


class WorkflowRun(Base, TimestampMixin):
    __tablename__ = "workflow_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_profile_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False
    )
    workflow_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # weekly_content_plan, daily_post, repurpose, analytics_report
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=WorkflowStatus.running.value
    )
    input_data: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)
    # The original input (e.g. WeeklyBrief)
    output_data: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)
    # The final output (e.g. content plan + assets)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    agent_traces: Mapped[list["AgentTrace"]] = relationship(
        back_populates="workflow_run", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<WorkflowRun {self.workflow_type} {self.status}>"


class AgentTrace(Base, TimestampMixin):
    __tablename__ = "agent_traces"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False
    )
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # orchestrator, strategist, writer, editor, research, repurposer, publisher, analytics
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    # Execution order within the workflow
    input_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model_used: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prompt_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # From prompt registry
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONBCompat, nullable=True)

    # Relationships
    workflow_run: Mapped["WorkflowRun"] = relationship(back_populates="agent_traces")

    def __repr__(self) -> str:
        return f"<AgentTrace {self.agent_name} step={self.step_order}>"
