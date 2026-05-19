"""Tests for Telegram handler pure functions and integration logic."""
import pytest

from app.integrations.telegram.bot import (
    build_asset_keyboard,
    build_tiktok_pack_keyboard,
    format_asset_card,
    format_error_message,
    format_tiktok_pack_detail,
    format_tiktok_pack_summary,
    format_workflow_summary,
)
from app.integrations.telegram.defaults import default_brand_profile, default_weekly_brief
from app.schemas.content import ContentAsset, ContentPillar, Platform
from app.schemas.tiktok import TikTokPack
from app.schemas.workflow import AgentTrace, WorkflowRun, WorkflowStatus
from app.workflows.weekly import run_weekly_content_plan


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_workflow_run() -> WorkflowRun:
    """Produce a real WorkflowRun using MockLLM."""
    return run_weekly_content_plan(
        brief=default_weekly_brief(),
        brand=default_brand_profile(),
    )


@pytest.fixture
def synthetic_pack() -> TikTokPack:
    """Synthetic TikTok Pack for unit tests."""
    return TikTokPack(
        title="Test Pack Title",
        hook="Test hook line",
        promise="You will learn something",
        timeline=[{"second": 0, "action": "Hook"}, {"second": 5, "action": "Explain"}],
        visual_instructions="Bold text overlays, fast cuts.",
        voiceover_script="This is a test voiceover script that explains the concept clearly.",
        on_screen_captions=["First caption", "Second caption", "Third caption"],
        recording_checklist=["Film vertical", "Use ring light"],
        cta="Follow for more",
        hashtags=["#test", "#tiktok", "#ai"],
        repurpose_links=[],
    )


@pytest.fixture
def synthetic_run(synthetic_pack: TikTokPack) -> WorkflowRun:
    """Lightweight synthetic WorkflowRun for fast unit tests."""
    return WorkflowRun(
        run_id="run-test01",
        workflow_type="weekly-content-plan",
        status=WorkflowStatus.COMPLETED,
        brand_handle="@testbrand",
        pillars=[
            ContentPillar(name="Pillar A", description="First pillar"),
            ContentPillar(name="Pillar B", description="Second pillar"),
        ],
        assets=[
            ContentAsset(
                id="asset-001",
                idea_id="idea-001",
                platform=Platform.X,
                format="thread",
                body="This is a test thread body with enough content to preview.",
                status="draft",
                notes="Test note",
            ),
            ContentAsset(
                id="asset-002",
                idea_id="idea-002",
                platform=Platform.LINKEDIN,
                format="post",
                body="Short LinkedIn post.",
                status="draft",
            ),
        ],
        tiktok_packs=[synthetic_pack],
        traces=[
            AgentTrace(
                agent="strategist",
                step="plan",
                input_summary="brief",
                output_summary="strategy",
                duration_ms=100,
            ),
        ],
    )


# ---------------------------------------------------------------------------
# format_workflow_summary
# ---------------------------------------------------------------------------


class TestFormatWorkflowSummary:
    def test_includes_status(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert "completed" in result

    def test_includes_run_id(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert synthetic_run.run_id in result

    def test_includes_brand_handle(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert synthetic_run.brand_handle in result

    def test_includes_pillar_names(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert "Pillar A" in result
        assert "Pillar B" in result

    def test_includes_asset_list(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert "Assets (2)" in result
        assert "[x] thread" in result
        assert "[linkedin] post" in result

    def test_includes_tiktok_pack_list(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert "TikTok Packs (1)" in result
        assert "Test Pack Title" in result

    def test_includes_trace_count(self, synthetic_run: WorkflowRun) -> None:
        result = format_workflow_summary(synthetic_run)
        assert "Traces: 1" in result

    def test_shows_error_message_when_present(self) -> None:
        run = WorkflowRun(
            run_id="run-err",
            workflow_type="weekly-content-plan",
            status=WorkflowStatus.FAILED,
            brand_handle="@test",
            error_message="Something broke",
        )
        result = format_workflow_summary(run)
        assert "Something broke" in result

    def test_real_mock_workflow(self, sample_workflow_run: WorkflowRun) -> None:
        result = format_workflow_summary(sample_workflow_run)
        assert "completed" in result
        assert sample_workflow_run.run_id in result
        assert len(sample_workflow_run.pillars) >= 1


# ---------------------------------------------------------------------------
# format_asset_card
# ---------------------------------------------------------------------------


class TestFormatAssetCard:
    def test_includes_platform(self, synthetic_run: WorkflowRun) -> None:
        asset = synthetic_run.assets[0]
        result = format_asset_card(asset, 0)
        assert "x" in result

    def test_includes_format(self, synthetic_run: WorkflowRun) -> None:
        asset = synthetic_run.assets[0]
        result = format_asset_card(asset, 0)
        assert "thread" in result

    def test_includes_status(self, synthetic_run: WorkflowRun) -> None:
        asset = synthetic_run.assets[0]
        result = format_asset_card(asset, 0)
        assert "draft" in result

    def test_includes_body_preview(self, synthetic_run: WorkflowRun) -> None:
        asset = synthetic_run.assets[0]
        result = format_asset_card(asset, 0)
        assert "test thread body" in result

    def test_index_is_1_based(self, synthetic_run: WorkflowRun) -> None:
        asset = synthetic_run.assets[1]
        result = format_asset_card(asset, 1)
        assert "Asset #2" in result

    def test_long_body_is_truncated(self) -> None:
        asset = ContentAsset(
            id="a1",
            idea_id="i1",
            platform=Platform.X,
            format="post",
            body="x" * 500,
            status="draft",
        )
        result = format_asset_card(asset, 0)
        assert "…" in result
        assert len(result) < 600


# ---------------------------------------------------------------------------
# format_error_message
# ---------------------------------------------------------------------------


class TestFormatErrorMessage:
    def test_no_token(self) -> None:
        result = format_error_message("no_token")
        assert "TELEGRAM_BOT_TOKEN" in result

    def test_workflow_exception_with_detail(self) -> None:
        result = format_error_message("workflow_exception", "timeout")
        assert "timeout" in result

    def test_workflow_exception_without_detail(self) -> None:
        result = format_error_message("workflow_exception")
        assert "falló" in result

    def test_invalid_payload(self) -> None:
        result = format_error_message("invalid_payload", "missing field")
        assert "missing field" in result

    def test_asset_not_found(self) -> None:
        result = format_error_message("asset_not_found")
        assert "Asset" in result

    def test_no_run_available(self) -> None:
        result = format_error_message("no_run_available")
        assert "/weekly" in result

    def test_unknown_error_type(self) -> None:
        result = format_error_message("something_else")
        assert "something_else" in result


# ---------------------------------------------------------------------------
# build_asset_keyboard
# ---------------------------------------------------------------------------


class TestBuildAssetKeyboard:
    def test_has_approve_button(self) -> None:
        keyboard = build_asset_keyboard("asset-001")
        button_labels = [b.text for row in keyboard.inline_keyboard for b in row]
        assert any("Approve" in label for label in button_labels)

    def test_has_reject_button(self) -> None:
        keyboard = build_asset_keyboard("asset-001")
        button_labels = [b.text for row in keyboard.inline_keyboard for b in row]
        assert any("Reject" in label for label in button_labels)

    def test_has_regenerate_button(self) -> None:
        keyboard = build_asset_keyboard("asset-001")
        button_labels = [b.text for row in keyboard.inline_keyboard for b in row]
        assert any("Regenerate" in label for label in button_labels)

    def test_callback_data_contains_asset_id(self) -> None:
        keyboard = build_asset_keyboard("asset-xyz")
        callback_data = [b.callback_data for row in keyboard.inline_keyboard for b in row]
        assert all("asset-xyz" in cd for cd in callback_data)

    def test_callback_data_format(self) -> None:
        keyboard = build_asset_keyboard("a1")
        callback_data = [b.callback_data for row in keyboard.inline_keyboard for b in row]
        for cd in callback_data:
            action, asset_id = cd.split(":", 1)
            assert action in ("approve", "reject", "regenerate")
            assert asset_id == "a1"


# ---------------------------------------------------------------------------
# defaults
# ---------------------------------------------------------------------------


class TestDefaults:
    def test_default_brand_profile_valid(self) -> None:
        brand = default_brand_profile()
        assert brand.name
        assert brand.handle
        assert brand.voice

    def test_default_weekly_brief_valid(self) -> None:
        brief = default_weekly_brief()
        assert brief.themes
        assert len(brief.themes) >= 1

    def test_defaults_produce_valid_run(self) -> None:
        run = run_weekly_content_plan(
            brief=default_weekly_brief(),
            brand=default_brand_profile(),
        )
        assert run.status == WorkflowStatus.COMPLETED
        assert len(run.pillars) >= 1
        assert len(run.assets) >= 1


# ---------------------------------------------------------------------------
# format_tiktok_pack_summary
# ---------------------------------------------------------------------------


class TestFormatTikTokPackSummary:
    def test_includes_title(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_summary(synthetic_pack, 0)
        assert "Test Pack Title" in result

    def test_includes_hook(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_summary(synthetic_pack, 0)
        assert "Test hook line" in result

    def test_includes_cta(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_summary(synthetic_pack, 0)
        assert "Follow for more" in result

    def test_includes_hashtags(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_summary(synthetic_pack, 0)
        assert "#test" in result

    def test_index_is_1_based(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_summary(synthetic_pack, 2)
        assert "Pack #3" in result


# ---------------------------------------------------------------------------
# format_tiktok_pack_detail
# ---------------------------------------------------------------------------


class TestFormatTikTokPackDetail:
    def test_includes_title(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "Test Pack Title" in result

    def test_includes_hook(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "Test hook line" in result

    def test_includes_promise(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "You will learn something" in result

    def test_includes_voiceover(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "test voiceover" in result

    def test_includes_visual_instructions(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "Bold text overlays" in result

    def test_includes_captions(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "First caption" in result
        assert "Second caption" in result

    def test_includes_checklist(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "Film vertical" in result
        assert "Use ring light" in result

    def test_includes_cta(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "Follow for more" in result

    def test_includes_all_hashtags(self, synthetic_pack: TikTokPack) -> None:
        result = format_tiktok_pack_detail(synthetic_pack)
        assert "#test" in result
        assert "#tiktok" in result
        assert "#ai" in result

    def test_long_voiceover_is_truncated(self) -> None:
        pack = TikTokPack(
            title="Long Pack",
            hook="Hook",
            promise="Promise",
            visual_instructions="Visuals",
            voiceover_script="x" * 300,
            cta="CTA",
        )
        result = format_tiktok_pack_detail(pack)
        assert "…" in result


# ---------------------------------------------------------------------------
# build_tiktok_pack_keyboard
# ---------------------------------------------------------------------------


class TestBuildTikTokPackKeyboard:
    def test_has_view_pack_button(self) -> None:
        keyboard = build_tiktok_pack_keyboard(0)
        button_labels = [b.text for row in keyboard.inline_keyboard for b in row]
        assert any("View Pack" in label for label in button_labels)

    def test_callback_data_format(self) -> None:
        keyboard = build_tiktok_pack_keyboard(3)
        callback_data = [b.callback_data for row in keyboard.inline_keyboard for b in row]
        assert callback_data == ["view_pack:3"]

    def test_index_zero(self) -> None:
        keyboard = build_tiktok_pack_keyboard(0)
        callback_data = [b.callback_data for row in keyboard.inline_keyboard for b in row]
        assert callback_data == ["view_pack:0"]


# ---------------------------------------------------------------------------
# format_error_message — pack_not_found
# ---------------------------------------------------------------------------


class TestFormatErrorMessagePackNotFound:
    def test_pack_not_found(self) -> None:
        result = format_error_message("pack_not_found")
        assert "TikTok Pack" in result
