"""Unit tests for TikTokPackGenerator."""
from __future__ import annotations

import pytest

from app.agents.llm import MockLLM
from app.prompts.registry import PromptRegistry
from app.schemas.content import ContentAsset, Platform
from app.schemas.tiktok import TikTokPack
from app.workflows.tiktok_packs import TikTokPackGenerator


@pytest.fixture
def generator() -> TikTokPackGenerator:
    llm = MockLLM()
    registry = PromptRegistry()
    return TikTokPackGenerator(llm=llm, registry=registry)


@pytest.fixture
def approved_tiktok_asset() -> ContentAsset:
    return ContentAsset(
        id="asset-tiktok-001",
        idea_id="idea-003",
        platform=Platform.TIKTOK,
        format="video-script",
        body="Demo script about AI memory in 60 seconds.",
        status="approved",
        notes="Strong hook.",
    )


@pytest.fixture
def rejected_tiktok_asset() -> ContentAsset:
    return ContentAsset(
        id="asset-tiktok-002",
        idea_id="idea-004",
        platform=Platform.TIKTOK,
        format="video-script",
        body="Another demo script.",
        status="rejected",
        notes="Weak CTA.",
    )


@pytest.fixture
def non_tiktok_asset() -> ContentAsset:
    return ContentAsset(
        id="asset-x-001",
        idea_id="idea-001",
        platform=Platform.X,
        format="post",
        body="X post about AI memory.",
        status="approved",
        notes="",
    )


@pytest.mark.asyncio
async def test_generator_produces_packs_for_approved_tiktok_assets(
    generator: TikTokPackGenerator,
    approved_tiktok_asset: ContentAsset,
) -> None:
    packs, traces = await generator.generate_packs(
        assets=[approved_tiktok_asset],
        brand_name="Test Brand",
        brand_voice="Casual builder",
        brand_tone="Direct",
        brand_forbidden=["Politics"],
    )
    assert len(packs) == 1
    assert len(traces) == 1
    assert isinstance(packs[0], TikTokPack)


@pytest.mark.asyncio
async def test_generator_skips_rejected_assets(
    generator: TikTokPackGenerator,
    approved_tiktok_asset: ContentAsset,
    rejected_tiktok_asset: ContentAsset,
) -> None:
    packs, traces = await generator.generate_packs(
        assets=[approved_tiktok_asset, rejected_tiktok_asset],
        brand_name="Test Brand",
        brand_voice="Casual builder",
        brand_tone="Direct",
        brand_forbidden=[],
    )
    assert len(packs) == 1
    assert packs[0].repurpose_links == [approved_tiktok_asset.id]


@pytest.mark.asyncio
async def test_generator_skips_non_tiktok_assets(
    generator: TikTokPackGenerator,
    non_tiktok_asset: ContentAsset,
) -> None:
    packs, traces = await generator.generate_packs(
        assets=[non_tiktok_asset],
        brand_name="Test Brand",
        brand_voice="Casual builder",
        brand_tone="Direct",
        brand_forbidden=[],
    )
    assert len(packs) == 0
    assert len(traces) == 0


@pytest.mark.asyncio
async def test_pack_has_required_fields(
    generator: TikTokPackGenerator,
    approved_tiktok_asset: ContentAsset,
) -> None:
    packs, _ = await generator.generate_packs(
        assets=[approved_tiktok_asset],
        brand_name="Test Brand",
        brand_voice="Casual builder",
        brand_tone="Direct",
        brand_forbidden=[],
    )
    pack = packs[0]
    assert pack.hook
    assert pack.voiceover_script
    assert pack.cta
    assert len(pack.hashtags) > 0
    assert len(pack.timeline) > 0


@pytest.mark.asyncio
async def test_repurpose_links_point_to_source_asset(
    generator: TikTokPackGenerator,
    approved_tiktok_asset: ContentAsset,
) -> None:
    packs, _ = await generator.generate_packs(
        assets=[approved_tiktok_asset],
        brand_name="Test Brand",
        brand_voice="Casual builder",
        brand_tone="Direct",
        brand_forbidden=[],
    )
    assert packs[0].repurpose_links == [approved_tiktok_asset.id]


@pytest.mark.asyncio
async def test_trace_contains_generator_agent_id(
    generator: TikTokPackGenerator,
    approved_tiktok_asset: ContentAsset,
) -> None:
    _, traces = await generator.generate_packs(
        assets=[approved_tiktok_asset],
        brand_name="Test Brand",
        brand_voice="Casual builder",
        brand_tone="Direct",
        brand_forbidden=[],
    )
    assert traces[0].agent == "tiktok_pack"
    assert traces[0].step == "generate_tiktok_pack"
