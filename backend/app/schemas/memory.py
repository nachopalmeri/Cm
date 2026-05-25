"""Memory system schemas."""
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime, UTC


class MemoryType(str, Enum):
    """Types of memory entries."""
    BRAND = "brand"
    CONTENT = "content"
    AUDIENCE = "audience"
    CONTEXT = "context"


class MemoryItem(BaseModel):
    """A single memory entry."""

    id: str = Field(description="Unique memory id.")
    memory_type: MemoryType = Field(description="Category of memory.")
    key: str = Field(description="Lookup key (e.g. voice, top_hooks).")
    value: str = Field(description="Stored value or JSON string.")
    source: str = Field(default="", description="Where this came from.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
