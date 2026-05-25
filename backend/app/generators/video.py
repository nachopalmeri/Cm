"""MoviePy video composer — TikTokPack → .mp4 with stock footage + voice + captions."""
from __future__ import annotations

import logging
import os
import tempfile
import uuid

from app.generators.captions import generate_caption_images
from app.generators.stock import StockVideoProvider
from app.generators.tts import generate_audio
from app.schemas.tiktok import TikTokPack

logger = logging.getLogger(__name__)

VIDEO_SIZE = (1080, 1920)  # 9:16 portrait
VIDEO_DURATION = 15  # seconds
VIDEO_FPS = 30


class TikTokVideoGenerator:
    """Orchestrates stock → TTS → captions → MoviePy composite → .mp4."""

    def __init__(self, stock_provider: StockVideoProvider | None = None) -> None:
        self._stock = stock_provider or StockVideoProvider()

    async def generate(self, pack: TikTokPack, output_dir: str | None = None) -> str:
        """Generate a .mp4 video from *pack*.

        Args:
            pack: A complete TikTokPack with voiceover, captions, etc.
            output_dir: Directory for output files (default: system temp).

        Returns:
            Absolute path to the generated .mp4 file.
        """
        work_dir = output_dir or tempfile.mkdtemp(prefix="tiktok_video_")
        os.makedirs(work_dir, exist_ok=True)

        # 1. Stock video
        stock_url = await self._stock.search_video(pack.title)
        video_clip = await self._build_video_clip(stock_url)

        # 2. TTS audio
        audio_path = os.path.join(work_dir, "voiceover.mp3")
        await generate_audio(pack.voiceover_script, audio_path)

        # 3. Caption overlays
        caption_dir = os.path.join(work_dir, "captions")
        caption_paths = generate_caption_images(
            pack.on_screen_captions or [pack.hook, pack.cta],
            VIDEO_SIZE,
            caption_dir,
        )

        # 4. Compose with MoviePy
        output_path = os.path.join(work_dir, f"{uuid.uuid4().hex[:8]}.mp4")
        self._compose(video_clip, audio_path, caption_paths, output_path)

        # 5. Store reference
        pack.video_path = output_path
        logger.info("Video generated → %s", output_path)
        return output_path

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _build_video_clip(self, stock_url: str | None):
        """Return a MoviePy VideoClip — stock footage or black fallback."""
        from moviepy import ColorClip, VideoFileClip

        if stock_url:
            try:
                import httpx

                tmp = os.path.join(tempfile.gettempdir(), f"pexels_{uuid.uuid4().hex[:8]}.mp4")
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.get(stock_url)
                    resp.raise_for_status()
                    with open(tmp, "wb") as f:
                        f.write(resp.content)

                clip = VideoFileClip(tmp)
                clip = clip.resized(new_size=VIDEO_SIZE)
                clip = clip.with_duration(VIDEO_DURATION)
                return clip
            except Exception as exc:
                logger.warning("Stock video download failed: %s — using fallback.", exc)

        # Fallback: solid dark background
        clip = ColorClip(size=VIDEO_SIZE, color=(20, 20, 20), duration=VIDEO_DURATION)
        return clip

    def _compose(
        self,
        video_clip,
        audio_path: str,
        caption_paths: list[str],
        output_path: str,
    ) -> None:
        """Overlay audio + captions onto *video_clip* and export .mp4."""
        from moviepy import AudioFileClip, CompositeVideoClip, ImageClip

        # Audio
        try:
            audio = AudioFileClip(audio_path)
            video_clip = video_clip.with_audio(audio)
        except Exception as exc:
            logger.warning("Could not attach audio: %s", exc)

        # Captions — spread evenly across duration
        layers = [video_clip]
        n = len(caption_paths)
        if n > 0:
            seg = video_clip.duration / n
            for i, cp in enumerate(caption_paths):
                cap = (
                    ImageClip(cp)
                    .with_duration(seg)
                    .with_start(i * seg)
                    .with_position("center")
                )
                layers.append(cap)

        final = CompositeVideoClip(layers, size=VIDEO_SIZE)

        try:
            final.write_videofile(
                output_path,
                fps=VIDEO_FPS,
                codec="libx264",
                audio_codec="aac",
                threads=2,
                logger=None,
            )
        finally:
            final.close()
            if hasattr(video_clip, "close"):
                video_clip.close()
