"""Obsidian vault scanner — reads .md files from a vault directory.

This lets the ghostwriter ingest your actual writing (class notes, daily notes,
journal entries, project docs) as voice samples so it learns your real style.
"""

import os
import re
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_NON_WRITING_DIRS = {
    ".obsidian", ".git", "node_modules", "__pycache__",
    "templates", "Templates", "_templates",
}

_NON_WRITING_FILES = {
    "README.md", "LICENSE.md", "CHANGELOG.md", "INDEX.md",
}


def _is_writing_file(path: Path) -> bool:
    """Check if a file is likely personal writing content."""
    name = path.name
    if name in _NON_WRITING_FILES:
        return False
    if name.startswith("._"):
        return False
    if name == name.upper() and "_" in name:
        return False
    return True


def _is_writing_dir(path: Path) -> bool:
    parts = path.parts
    for p in parts:
        if p in _NON_WRITING_DIRS:
            return False
    return True


def _extract_meaningful_content(text: str) -> Optional[str]:
    """Extract meaningful writing from a markdown note.

    Strips YAML frontmatter, markdown formatting, and empty lines.
    Returns None if the note is too short (< 50 chars of actual content).
    """
    text = re.sub(r"^---\s*\n.*?\n---\s*\n", "", text, flags=re.DOTALL)
    text = re.sub(r"#{1,6}\s+", "", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    if len(text) < 50:
        return None
    return text


def scan_vault(
    vault_path: str,
    max_notes: int = 50,
    min_words: int = 20,
) -> list[dict]:
    """Scan an Obsidian vault for personal writing content.

    Args:
        vault_path: Path to the Obsidian vault directory.
        max_notes: Maximum number of notes to scan (0 = unlimited).
        min_words: Minimum words for a note to be included.

    Returns:
        List of dicts with 'content', 'source', 'title', 'path'.
    """
    vault = Path(vault_path)
    if not vault.is_dir():
        logger.warning("Obsidian vault not found: %s", vault_path)
        return []

    results: list[dict] = []
    scanned = 0

    for filepath in vault.rglob("*.md"):
        if not _is_writing_dir(filepath.parent):
            continue
        if not _is_writing_file(filepath):
            continue

        try:
            text = filepath.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        content = _extract_meaningful_content(text)
        if not content:
            continue

        word_count = len(content.split())
        if word_count < min_words:
            continue

        relative = filepath.relative_to(vault)
        results.append({
            "content": content,
            "source": f"obsidian:{relative}",
            "title": filepath.stem,
            "path": str(relative),
            "word_count": word_count,
        })

        scanned += 1
        if max_notes > 0 and scanned >= max_notes:
            break

    logger.info(
        "Scanned %d notes from Obsidian vault (total results: %d)",
        scanned, len(results),
    )
    return results


class ObsidianScanner:
    """Scanner for extracting voice samples from an Obsidian vault."""

    def __init__(self, vault_path: str):
        self.vault_path = vault_path

    def scan(self, max_notes: int = 50) -> list[dict]:
        return scan_vault(self.vault_path, max_notes=max_notes)

    def scan_by_folder(
        self,
        folders: list[str],
        max_notes: int = 50,
    ) -> list[dict]:
        """Scan only specific folders within the vault."""
        vault = Path(self.vault_path)
        if not vault.is_dir():
            return []

        results: list[dict] = []

        for folder in folders:
            folder_path = vault / folder
            if not folder_path.is_dir():
                logger.warning("Folder not found in vault: %s", folder)
                continue

            for filepath in folder_path.rglob("*.md"):
                if not _is_writing_file(filepath):
                    continue
                try:
                    text = filepath.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue

                content = _extract_meaningful_content(text)
                if not content or len(content.split()) < 20:
                    continue

                relative = filepath.relative_to(vault)
                results.append({
                    "content": content,
                    "source": f"obsidian:{relative}",
                    "title": filepath.stem,
                    "path": str(relative),
                    "word_count": len(content.split()),
                })

                if max_notes > 0 and len(results) >= max_notes:
                    return results

        return results
