"""LLM provider interface and mock implementation.

Defines the LLMProvider protocol that all LLM backends must satisfy,
plus a MockLLM for development and testing without external API calls.
"""
from __future__ import annotations

import json
import time
from typing import Any, Protocol, runtime_checkable

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# LLM response model
# ---------------------------------------------------------------------------

class LLMResponse(BaseModel):
    """Structured response from an LLM call."""

    content: str = Field(description="Generated text content.")
    model_name: str = Field(default="mock", description="Model that generated the response.")
    prompt_tokens: int = Field(default=0, description="Tokens in the prompt.")
    completion_tokens: int = Field(default=0, description="Tokens in the completion.")
    latency_ms: int = Field(default=0, description="Request latency in milliseconds.")


# ---------------------------------------------------------------------------
# LLM provider protocol
# ---------------------------------------------------------------------------

@runtime_checkable
class LLMProvider(Protocol):
    """Protocol for LLM backends.

    Implementations must support generate() with system/user prompts
    and optional kwargs for temperature, max_tokens, etc.
    """

    model_name: str

    async def generate(
        self,
        system: str,
        user: str,
        **kwargs: Any,
    ) -> LLMResponse:
        """Generate a completion given system and user prompts."""
        ...


# ---------------------------------------------------------------------------
# Mock LLM implementation
# ---------------------------------------------------------------------------

_STRATEGIST_MOCK = json.dumps({
    "narrative": "This week we position the brand as a pragmatic builder who ships AI tools with real memory — not just prompts.",
    "pillars": [
        {"name": "Memory-first AI", "description": "Why AI agents need persistent memory to be useful.", "platforms": ["x", "linkedin", "tiktok"]},
        {"name": "Ship fast, iterate", "description": "MVP mindset applied to AI products.", "platforms": ["x", "tiktok"]},
        {"name": "Builder in public", "description": "Sharing the journey of building social-ai-os.", "platforms": ["x", "substack", "tiktok"]},
    ],
    "ideas": [
        {"title": "Why your AI agent forgets everything", "hook": "Your AI assistant has amnesia.", "angle": "Memory is the missing layer in AI agents.", "platform": "x", "format": "thread", "pillar": "Memory-first AI"},
        {"title": "MVP > Perfection: a framework for AI products", "hook": "Stop polishing. Start shipping.", "angle": "How to validate AI product ideas in 48 hours.", "platform": "x", "format": "post", "pillar": "Ship fast, iterate"},
        {"title": "Building social-ai-os: week 1", "hook": "I'm building an AI OS for personal brands.", "angle": "What I learned building the agent layer.", "platform": "linkedin", "format": "post", "pillar": "Builder in public"},
        {"title": "AI memory explained in 60 seconds", "hook": "Your AI has amnesia. Here's why.", "angle": "Explain persistent memory for AI agents in a 60-second video.", "platform": "tiktok", "format": "video-script", "pillar": "Memory-first AI"},
        {"title": "I shipped a feature in 2 hours", "hook": "Stop polishing. Start shipping.", "angle": "Show the before/after of shipping fast vs perfecting forever.", "platform": "tiktok", "format": "video-script", "pillar": "Ship fast, iterate"},
    ],
    "platform_distribution": {
        "x": ["Why your AI agent forgets everything", "MVP > Perfection: a framework for AI products"],
        "linkedin": ["Building social-ai-os: week 1"],
        "substack": ["Building social-ai-os: week 1"],
        "tiktok": ["AI memory explained in 60 seconds", "I shipped a feature in 2 hours"],
    },
})

_WRITER_MOCK_X_POST = """Your AI assistant has amnesia.

You ask it to write like you. It forgets your voice by tomorrow.

You tell it your strategy. It can't recall it next week.

The missing layer in AI agents isn't a better model.

It's MEMORY.

Here's why persistent memory changes everything for AI-native workflows 🧵"""

_WRITER_MOCK_LINKEDIN = """I'm building an AI OS for personal brands.

Not another post generator. Not a scheduler with AI sprinkled on top.

An actual operating system for content — with persistent memory, multi-agent orchestration, and learning loops.

Week 1 insight: the agent layer needs explicit contracts, not vibes.

Each agent (Strategist, Writer, Editor) has typed inputs and outputs. Versioned prompts. Traces for observability.

This isn't over-engineering. It's how you build AI that actually gets better over time.

What's your take — should AI tools have memory or just better prompts?"""

_EDITOR_MOCK_APPROVED = json.dumps({
    "approved": True,
    "issues": [],
    "revised_asset": None,
    "voice_fit_score": 0.85,
})

_EDITOR_MOCK_WITH_ISSUES = json.dumps({
    "approved": False,
    "issues": [
        {
            "category": "ai_slop",
            "severity": "medium",
            "description": "Phrase 'game-changing' sounds like generic AI output.",
            "suggestion": "Replace with a concrete observation or specific claim.",
        },
        {
            "category": "hook",
            "severity": "low",
            "description": "Hook could be sharper.",
            "suggestion": "Lead with the contrarian take instead of the observation.",
        },
    ],
    "revised_asset": None,
    "voice_fit_score": 0.6,
})

_TIKTOK_PACK_MOCK = json.dumps({
    "title": "AI Memory Explained in 60 Seconds",
    "hook": "Your AI has amnesia. Here's why.",
    "promise": "You'll understand why AI memory matters in under 60 seconds.",
    "timeline": [
        {"second": 0, "action": "Hook: text on screen + surprised face"},
        {"second": 3, "action": "Cut to screenshot of ChatGPT forgetting context"},
        {"second": 8, "action": "Explain the problem in 10 words"},
        {"second": 15, "action": "Show social-ai-os memory architecture diagram"},
        {"second": 25, "action": "Demo: same prompt, better result with memory"},
        {"second": 40, "action": "Text overlay: 'Memory > Model size'"},
        {"second": 50, "action": "CTA slide with handle and follow button"},
    ],
    "visual_instructions": "Fast cuts, bold text overlays, screen recordings mixed with talking head. Keep energy high. Use trending audio if available.",
    "voiceover_script": "Your AI assistant has amnesia. You ask it to write like you — it forgets your voice by tomorrow. The missing layer isn't a bigger model. It's memory. Here's what happens when you give AI persistent memory.",
    "on_screen_captions": [
        "Your AI has amnesia",
        "It forgets your voice by tomorrow",
        "Memory > Model size",
    ],
    "recording_checklist": [
        "Film in vertical 9:16",
        "Use ring light for face shots",
        "Screen record at 60fps",
        "Export with captions burned in",
    ],
    "cta": "Follow for more AI building tips. Comment 'MEMORY' if you want a deep dive.",
    "hashtags": ["#AIMemory", "#BuildInPublic", "#AIAgents", "#TechTok", "#StartupLife"],
    "repurpose_links": [],
})


class MockLLM:
    """Mock LLM that returns pre-defined responses per agent.

    Used for development, testing, and CI without external API calls.
    Responses are deterministic based on the system prompt content.
    """

    def __init__(self) -> None:
        self.model_name = "mock"

    async def generate(
        self,
        system: str,
        user: str,
        **kwargs: Any,
    ) -> LLMResponse:
        """Return a mock response based on which agent is calling."""
        start = time.monotonic()

        system_lower = system.lower()

        if "strategist" in system_lower:
            content = _STRATEGIST_MOCK
        elif "writer" in system_lower:
            if "linkedin" in user.lower():
                content = _WRITER_MOCK_LINKEDIN
            else:
                content = _WRITER_MOCK_X_POST
        elif "editor" in system_lower:
            if "ai_slop" in user.lower() or "generic" in user.lower():
                content = _EDITOR_MOCK_WITH_ISSUES
            else:
                content = _EDITOR_MOCK_APPROVED
        elif "tiktok" in system_lower:
            content = _TIKTOK_PACK_MOCK
        else:
            content = "Mock LLM response."

        elapsed_ms = int((time.monotonic() - start) * 1000)

        return LLMResponse(
            content=content,
            model_name=self.model_name,
            prompt_tokens=len(system) // 4 + len(user) // 4,
            completion_tokens=len(content) // 4,
            latency_ms=elapsed_ms,
        )


# ---------------------------------------------------------------------------
# OpenAI provider
# ---------------------------------------------------------------------------

class OpenAIProvider:
    """OpenAI chat completions provider (requires openai package)."""

    def __init__(self, model: str = "gpt-4o-mini", api_key: str | None = None) -> None:
        try:
            import openai as _openai
            self._openai = _openai
        except ImportError as e:
            raise ImportError("openai package not installed. Run: pip install openai") from e
        self.model_name = model
        self._api_key = api_key

    async def generate(self, system: str, user: str, **kwargs: Any) -> LLMResponse:
        import time
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self._api_key)
        start = time.monotonic()
        response = await client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=kwargs.get("temperature", 0.8),
            max_tokens=kwargs.get("max_tokens", 1024),
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        content = response.choices[0].message.content or ""
        usage = response.usage
        return LLMResponse(
            content=content,
            model_name=self.model_name,
            prompt_tokens=usage.prompt_tokens if usage else 0,
            completion_tokens=usage.completion_tokens if usage else 0,
            latency_ms=elapsed_ms,
        )


# ---------------------------------------------------------------------------
# Anthropic provider
# ---------------------------------------------------------------------------

class AnthropicProvider:
    """Anthropic Messages API provider (requires anthropic package)."""

    def __init__(self, model: str = "claude-3-5-haiku-20241022", api_key: str | None = None) -> None:
        try:
            import anthropic as _anthropic
            self._anthropic = _anthropic
        except ImportError as e:
            raise ImportError("anthropic package not installed. Run: pip install anthropic") from e
        self.model_name = model
        self._api_key = api_key

    async def generate(self, system: str, user: str, **kwargs: Any) -> LLMResponse:
        import time
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=self._api_key)
        start = time.monotonic()
        response = await client.messages.create(
            model=self.model_name,
            max_tokens=kwargs.get("max_tokens", 1024),
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        content = response.content[0].text if response.content else ""
        return LLMResponse(
            content=content,
            model_name=self.model_name,
            prompt_tokens=response.usage.input_tokens,
            completion_tokens=response.usage.output_tokens,
            latency_ms=elapsed_ms,
        )


# ---------------------------------------------------------------------------
# LLM factory
# ---------------------------------------------------------------------------

def build_llm_provider(
    provider: str = "mock",
    openai_api_key: str | None = None,
    anthropic_api_key: str | None = None,
    model: str | None = None,
) -> "LLMProvider":
    """Build an LLMProvider from settings.

    provider values: "mock", "openai", "anthropic"
    Falls back to MockLLM if keys are missing.
    """
    if provider == "openai":
        if not openai_api_key:
            import logging
            logging.getLogger(__name__).warning("OPENAI_API_KEY not set, falling back to MockLLM")
            return MockLLM()
        return OpenAIProvider(model=model or "gpt-4o-mini", api_key=openai_api_key)

    if provider == "anthropic":
        if not anthropic_api_key:
            import logging
            logging.getLogger(__name__).warning("ANTHROPIC_API_KEY not set, falling back to MockLLM")
            return MockLLM()
        return AnthropicProvider(model=model or "claude-3-5-haiku-20241022", api_key=anthropic_api_key)

    return MockLLM()
