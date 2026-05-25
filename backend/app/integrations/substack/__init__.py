"""Substack integration — RSS client + local NLP analyzer."""
from .client import SubstackClient, ManualPostInput
from .analyzer import SubstackAnalysis, analyze_posts

__all__ = [
    "SubstackClient",
    "ManualPostInput",
    "SubstackAnalysis",
    "analyze_posts",
]
