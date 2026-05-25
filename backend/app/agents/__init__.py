"""Agent layer — Orchestrator, Strategist, Writer, Editor."""
from .contracts import AgentInput, AgentOutput, AgentProtocol
from .llm import LLMProvider, LLMResponse, MockLLM
from .orchestrator import OrchestratorAgent
from .strategist import StrategistAgent
from .writer import WriterAgent
from .editor import EditorAgent

__all__ = [
    "AgentInput",
    "AgentOutput",
    "AgentProtocol",
    "LLMProvider",
    "LLMResponse",
    "MockLLM",
    "OrchestratorAgent",
    "StrategistAgent",
    "WriterAgent",
    "EditorAgent",
]
