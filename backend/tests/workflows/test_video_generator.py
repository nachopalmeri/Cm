"""Tests for TikTokVideoGenerator — all external APIs mocked."""
from __future__ import annotations

import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.generators.captions import generate_caption_images
from app.generators.stock import StockVideoProvider
from app.generators.tts import generate_audio
from app.generators.video import TikTokVideoGenerator
from app.schemas.tiktok import TikTokPack


# ---------------------------------------------------------------------------
# Sample data
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_pack() -> TikTokPack:
    return TikTokPack(
        title="AI Memory in 60 Seconds",
        hook="Your AI should never forget.",
        promise="Learn how memory works in AI agents.",
        timeline=[
            {"second": 0, "action": "hook"},
            {"second": 5, "action": "explain"},
            {"second": 10, "action": "cta"},
        ],
        visual_instructions="Screen recording of terminal + code.",
        voiceover_script="AI memory is the backbone of autonomous agents. Here is how it works.",
        on_screen_captions=[
            "AI Memory Explained",
            "Short-term vs Long-term",
            "Follow for more AI content",
        ],
        recording_checklist=["Open terminal", "Record 15s"],
        cta="Follow for more AI builds.",
        hashtags=["#AIMemory", "#BuildInPublic"],
        repurpose_links=["asset-001"],
    )


@pytest.fixture
def temp_dir():
    d = tempfile.mkdtemp(prefix="tiktok_test_")
    yield d
    import shutil
    shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# StockVideoProvider tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_stock_returns_none_when_no_api_key():
    provider = StockVideoProvider(api_key=None)
    result = await provider.search_video("test")
    assert result is None


@pytest.mark.asyncio
async def test_stock_returns_none_on_http_error():
    provider = StockVideoProvider(api_key="fake-key")
    with patch("httpx.AsyncClient.get", side_effect=Exception("network error")):
        result = await provider.search_video("test")
    assert result is None


@pytest.mark.asyncio
async def test_stock_returns_url_on_success():
    provider = StockVideoProvider(api_key="fake-key")
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "videos": [
            {
                "video_files": [
                    {"link": "https://example.com/video.mp4", "width": 1080, "height": 1920}
                ]
            }
        ]
    }
    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        result = await provider.search_video("AI")
    assert result == "https://example.com/video.mp4"


# ---------------------------------------------------------------------------
# TTS tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tts_generates_audio_file(temp_dir):
    output = os.path.join(temp_dir, "test.mp3")

    async def fake_save(path):
        with open(path, "wb") as f:
            f.write(b"\xff\xfb\x90\x00" * 100)  # minimal mp3 header

    with patch("edge_tts.Communicate") as MockComm:
        instance = MockComm.return_value
        instance.save = fake_save
        result = await generate_audio("Hello world", output)

    assert result == output
    assert os.path.isfile(output)
    assert os.path.getsize(output) > 0


@pytest.mark.asyncio
async def test_tts_handles_empty_script(temp_dir):
    output = os.path.join(temp_dir, "silent.mp3")

    async def fake_save(path):
        with open(path, "wb") as f:
            f.write(b"\xff\xfb\x90\x00" * 50)

    with patch("edge_tts.Communicate") as MockComm:
        instance = MockComm.return_value
        instance.save = fake_save
        result = await generate_audio("", output)

    assert os.path.isfile(result)


# ---------------------------------------------------------------------------
# Captions tests
# ---------------------------------------------------------------------------

def test_captions_generate_images(temp_dir):
    captions = ["Line one", "Line two"]
    paths = generate_caption_images(captions, (1080, 1920), temp_dir)
    assert len(paths) == 2
    for p in paths:
        assert os.path.isfile(p)
        assert p.endswith(".png")


def test_captions_empty_list(temp_dir):
    paths = generate_caption_images([], (1080, 1920), temp_dir)
    assert paths == []


# ---------------------------------------------------------------------------
# TikTokVideoGenerator integration tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generator_produces_mp4(sample_pack, temp_dir):
    """End-to-end with all external deps mocked."""
    # Mock stock provider
    stock = StockVideoProvider(api_key=None)  # forces fallback

    # Mock edge-tts
    async def fake_tts_save(path):
        with open(path, "wb") as f:
            f.write(b"\xff\xfb\x90\x00" * 200)

    # Mock moviepy write_videofile
    def fake_write(self, path, **kwargs):
        with open(path, "wb") as f:
            f.write(b"fake-mp4-content")

    with (
        patch("edge_tts.Communicate") as MockComm,
        patch("moviepy.CompositeVideoClip.write_videofile", fake_write),
    ):
        MockComm.return_value.save = fake_tts_save

        gen = TikTokVideoGenerator(stock_provider=stock)
        output = await gen.generate(sample_pack, output_dir=temp_dir)

    assert os.path.isfile(output)
    assert output.endswith(".mp4")
    assert sample_pack.video_path == output


@pytest.mark.asyncio
async def test_video_path_added_to_pack(sample_pack, temp_dir):
    """Verify video_path is set on the pack after generation."""
    stock = StockVideoProvider(api_key=None)

    async def fake_tts_save(path):
        with open(path, "wb") as f:
            f.write(b"\xff\xfb\x90\x00" * 100)

    def fake_write(self, path, **kwargs):
        with open(path, "wb") as f:
            f.write(b"fake-mp4-content")

    with (
        patch("edge_tts.Communicate") as MockComm,
        patch("moviepy.CompositeVideoClip.write_videofile", fake_write),
    ):
        MockComm.return_value.save = fake_tts_save
        gen = TikTokVideoGenerator(stock_provider=stock)
        await gen.generate(sample_pack, output_dir=temp_dir)

    assert sample_pack.video_path is not None
    assert sample_pack.video_path.endswith(".mp4")


@pytest.mark.asyncio
async def test_fallback_when_no_stock_video(sample_pack, temp_dir):
    """Without Pexels key, generator uses black background fallback."""
    stock = StockVideoProvider(api_key=None)

    async def fake_tts_save(path):
        with open(path, "wb") as f:
            f.write(b"\xff\xfb\x90\x00" * 100)

    def fake_write(self, path, **kwargs):
        with open(path, "wb") as f:
            f.write(b"fake-mp4-content")

    with (
        patch("edge_tts.Communicate") as MockComm,
        patch("moviepy.CompositeVideoClip.write_videofile", fake_write),
    ):
        MockComm.return_value.save = fake_tts_save
        gen = TikTokVideoGenerator(stock_provider=stock)
        output = await gen.generate(sample_pack, output_dir=temp_dir)

    assert os.path.isfile(output)
    assert os.path.getsize(output) > 0
