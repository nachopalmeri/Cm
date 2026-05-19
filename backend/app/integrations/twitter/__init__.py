"""Twitter/X integration — client + local NLP analyzer."""
from .client import TwitterClient, ManualTweetInput
from .analyzer import TwitterAnalysis, analyze_tweets

__all__ = [
    "TwitterClient",
    "ManualTweetInput",
    "TwitterAnalysis",
    "analyze_tweets",
]
