"""Approval flow schemas."""
from enum import Enum
from pydantic import BaseModel, Field


class ApprovalStatus(str, Enum):
    """Approval statuses."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REWRITE_REQUESTED = "rewrite_requested"


class ApprovalDecision(BaseModel):
    """A decision on a content asset."""

    asset_id: str = Field(description="Target asset id.")
    status: ApprovalStatus = Field(description="Decision status.")
    feedback: str = Field(default="", description="User feedback or rewrite instructions.")
    decided_at: str = Field(default="", description="ISO timestamp of decision.")
