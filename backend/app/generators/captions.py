"""Pillow-based caption overlay generator for video composition."""
from __future__ import annotations

import logging
import os

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

DEFAULT_FONT_SIZE = 48
CAPTION_BG = (0, 0, 0, 140)  # semi-transparent black
TEXT_COLOR = (255, 255, 255, 255)  # white


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load a truetype font, falling back to PIL default."""
    font_paths = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for fp in font_paths:
        if os.path.isfile(fp):
            try:
                return ImageFont.truetype(fp, size=size)
            except Exception:
                continue
    return ImageFont.load_default()


def generate_caption_images(
    captions: list[str],
    video_size: tuple[int, int],
    output_dir: str,
    font_size: int = DEFAULT_FONT_SIZE,
) -> list[str]:
    """Create one PNG per caption line, sized to the video frame.

    Each image has a semi-transparent black bar at the bottom with white text,
    suitable for MoviePy ImageClip overlay.

    Args:
        captions: List of caption strings.
        video_size: (width, height) of the target video.
        output_dir: Directory to write PNG files into.
        font_size: Font size in points.

    Returns:
        List of absolute paths to the generated PNG images.
    """
    os.makedirs(output_dir, exist_ok=True)
    width, height = video_size
    font = _load_font(font_size)
    paths: list[str] = []

    for i, text in enumerate(captions):
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Measure text
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]

        # Background bar
        bar_pad = 20
        bar_top = height - th - bar_pad * 3
        bar_bottom = height
        draw.rectangle([(0, bar_top), (width, bar_bottom)], fill=CAPTION_BG)

        # Centered text
        tx = (width - tw) // 2
        ty = bar_top + bar_pad
        draw.text((tx, ty), text, fill=TEXT_COLOR, font=font)

        out = os.path.join(output_dir, f"caption_{i:03d}.png")
        img.save(out, "PNG")
        paths.append(out)

    logger.info("Generated %d caption images in %s", len(paths), output_dir)
    return paths
