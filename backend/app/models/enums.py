import enum


class ContentStatus(str, enum.Enum):
    draft = "draft"
    in_review = "in_review"
    approved = "approved"
    rejected = "rejected"
    published = "published"
    archived = "archived"


class Platform(str, enum.Enum):
    x = "x"
    linkedin = "linkedin"
    substack = "substack"
    tiktok = "tiktok"
    instagram = "instagram"
    other = "other"


class ApprovalDecision(str, enum.Enum):
    approve = "approve"
    reject = "reject"
    rewrite = "rewrite"
    edit = "edit"


class EmbeddingSourceType(str, enum.Enum):
    brand_memory = "brand_memory"
    content_idea = "content_idea"
    context_entry = "context_entry"
    audience_insight = "audience_insight"


class ContextEntryType(str, enum.Enum):
    project = "project"
    event = "event"
    milestone = "milestone"
    learning = "learning"
    personal = "personal"


class AudienceSegment(str, enum.Enum):
    developers = "developers"
    founders = "founders"
    freelancers = "freelancers"
    tech_creators = "tech_creators"
    students = "students"
    general = "general"


class WorkflowStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
