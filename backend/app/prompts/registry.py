"""Prompt registry — versioned, immutable prompt templates loaded from YAML.

Prompts are stored as YAML files in prompts/versions/ with the naming
convention {agent_id}_v{N}.yaml. Each file contains metadata (id, version,
agent, created_at) plus the prompt content (system_prompt, user_template,
variables).

The registry loads all versions on init and serves the latest by default.
Older versions remain accessible for reproducibility and A/B testing.
"""
from __future__ import annotations

import re
from datetime import datetime, UTC
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field


_VERSIONS_DIR = Path(__file__).parent / "versions"


class PromptTemplate(BaseModel):
    """A single versioned prompt template."""

    id: str = Field(description="Prompt identifier, e.g. 'strategist_v1'.")
    agent: str = Field(description="Agent this prompt belongs to.")
    version: int = Field(description="Version number.")
    system_prompt: str = Field(description="System prompt text.")
    user_template: str = Field(description="User prompt template with {variable} placeholders.")
    variables: list[str] = Field(default_factory=list, description="Expected template variables.")
    created_at: datetime = Field(description="When this prompt version was created.")

    def render_user(self, **kwargs: Any) -> str:
        """Render the user_template with the provided variables."""
        missing = set(self.variables) - set(kwargs.keys())
        if missing:
            raise ValueError(f"Missing template variables: {missing}")
        return self.user_template.format(**kwargs)


class PromptRegistry:
    """Registry of versioned prompt templates.

    Loads all YAML files from the versions/ directory on init.
    Provides lookup by agent (latest version) or by exact id.
    """

    def __init__(self, versions_dir: Path | None = None) -> None:
        self._versions_dir = versions_dir or _VERSIONS_DIR
        self._prompts: dict[str, PromptTemplate] = {}
        self._by_agent: dict[str, list[PromptTemplate]] = {}
        self._load_all()

    def _load_all(self) -> None:
        """Load all YAML prompt files from the versions directory."""
        if not self._versions_dir.exists():
            return

        for path in sorted(self._versions_dir.glob("*.yaml")):
            with open(path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)

            template = PromptTemplate(
                id=data["id"],
                agent=data["agent"],
                version=data["version"],
                system_prompt=data["system_prompt"],
                user_template=data["user_template"],
                variables=data.get("variables", []),
                created_at=data.get("created_at", datetime.now(UTC)),
            )
            self._prompts[template.id] = template
            self._by_agent.setdefault(template.agent, []).append(template)

        # Sort each agent's versions so last = latest
        for agent in self._by_agent:
            self._by_agent[agent].sort(key=lambda t: t.version)

    def get_prompt(self, agent: str, version: int | None = None) -> PromptTemplate:
        """Get a prompt template by agent name.

        If version is None, returns the latest version.
        Raises KeyError if agent or version not found.
        """
        versions = self._by_agent.get(agent)
        if not versions:
            raise KeyError(f"No prompts found for agent '{agent}'")

        if version is None:
            return versions[-1]

        for t in versions:
            if t.version == version:
                return t

        raise KeyError(f"Version {version} not found for agent '{agent}'")

    def get_by_id(self, prompt_id: str) -> PromptTemplate:
        """Get a prompt template by its exact id (e.g. 'strategist_v1')."""
        if prompt_id not in self._prompts:
            raise KeyError(f"Prompt '{prompt_id}' not found")
        return self._prompts[prompt_id]

    def list_versions(self, agent: str) -> list[int]:
        """List available version numbers for an agent."""
        versions = self._by_agent.get(agent, [])
        return [t.version for t in versions]

    def list_agents(self) -> list[str]:
        """List all agents that have prompt templates."""
        return list(self._by_agent.keys())
