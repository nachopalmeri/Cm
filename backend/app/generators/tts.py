"""edge-tts wrapper — generates audio from voiceover script."""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

DEFAULT_VOICE = "en-US-JennyNeural"


async def generate_audio(script: str, output_path: str, voice: str = DEFAULT_VOICE) -> str:
    """Generate an MP3 audio file from *script* using Microsoft Edge TTS.

    Args:
        script: The voiceover text to speak.
        output_path: Where to write the .mp3 file (directory must exist).
        voice: edge-tts voice name (default: en-US-JennyNeural).

    Returns:
        The *output_path* on success.

    Raises:
        RuntimeError: If edge-tts fails.
    """
    try:
        import edge_tts
    except ImportError:
        raise RuntimeError(
            "edge-tts is not installed. Run: pip install edge-tts"
        )

    if not script.strip():
        logger.warning("Empty voiceover script — generating silent audio.")
        script = " "

    communicate = edge_tts.Communicate(text=script, voice=voice)

    try:
        await communicate.save(output_path)
    except Exception as exc:
        raise RuntimeError(f"edge-tts synthesis failed: {exc}") from exc

    if not os.path.isfile(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError(f"edge-tts produced no output at {output_path}")

    logger.info("TTS audio saved → %s", output_path)
    return output_path
