"""Base repository with generic CRUD operations."""
import uuid
from typing import TypeVar, Generic, Type, Optional, Sequence
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.base import SoftDeleteMixin

ModelType = TypeVar("ModelType", bound=object)


class BaseRepository(Generic[ModelType]):
    """Generic repository providing CRUD for any SQLAlchemy model."""

    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session

    def get_by_id(self, id: uuid.UUID) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))
        return self.session.execute(stmt).scalar_one_or_none()

    def list_all(
        self,
        offset: int = 0,
        limit: int = 100,
        **filters: object,
    ) -> Sequence[ModelType]:
        stmt = select(self.model)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))
        for key, value in filters.items():
            if hasattr(self.model, key):
                stmt = stmt.where(getattr(self.model, key) == value)
        stmt = stmt.offset(offset).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def count(self, **filters: object) -> int:
        stmt = select(func.count()).select_from(self.model)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))
        for key, value in filters.items():
            if hasattr(self.model, key):
                stmt = stmt.where(getattr(self.model, key) == value)
        return self.session.execute(stmt).scalar_one()

    def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        self.session.flush()
        return obj

    def update(self, id: uuid.UUID, **kwargs: object) -> Optional[ModelType]:
        obj = self.get_by_id(id)
        if obj is None:
            return None
        for key, value in kwargs.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        self.session.flush()
        return obj

    def soft_delete(self, id: uuid.UUID) -> bool:
        import datetime
        obj = self.get_by_id(id)
        if obj is None or not hasattr(obj, "deleted_at"):
            return False
        obj.deleted_at = datetime.datetime.now(datetime.timezone.utc)
        self.session.flush()
        return True

    def hard_delete(self, id: uuid.UUID) -> bool:
        obj = self.get_by_id(id)
        if obj is None:
            return False
        self.session.delete(obj)
        self.session.flush()
        return True
