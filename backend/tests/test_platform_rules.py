"""Tests for platform_rules module."""
import pytest
from app.ghostwriter.platform_rules import (
    PLATFORM_RULES,
    PlatformRule,
    get_platform_rule,
    render_platform_rules,
)


class TestGetPlatformRule:
    def test_x_returns_correct_rule(self):
        rule = get_platform_rule("x")
        assert rule.name == "X / Twitter"
        assert rule.cross_post_hint is not None

    def test_substack_returns_correct_rule(self):
        rule = get_platform_rule("substack")
        assert rule.name == "Substack"
        assert "800" in rule.ideal_length

    def test_linkedin_returns_correct_rule(self):
        rule = get_platform_rule("linkedin")
        assert rule.name == "LinkedIn"
        assert rule.cross_post_hint is None

    def test_tiktok_returns_correct_rule(self):
        rule = get_platform_rule("tiktok")
        assert rule.name == "TikTok (guion hablado)"
        assert "60" in rule.ideal_length

    def test_case_insensitive(self):
        assert get_platform_rule("X") == get_platform_rule("x")
        assert get_platform_rule("LinkedIn") == get_platform_rule("linkedin")
        assert get_platform_rule("SUBSTACK") == get_platform_rule("substack")

    def test_unknown_platform_returns_fallback(self):
        rule = get_platform_rule("instagram")
        assert isinstance(rule, PlatformRule)
        assert rule.name == "General"

    def test_empty_platform_returns_fallback(self):
        rule = get_platform_rule("")
        assert rule.name == "General"


class TestRenderPlatformRules:
    def test_render_x_contains_key_fields(self):
        rendered = render_platform_rules("x")
        assert "X / Twitter" in rendered
        assert "hook" in rendered.lower()
        assert "cross" in rendered.lower()

    def test_render_substack_cross_post_present(self):
        rendered = render_platform_rules("substack")
        assert "Substack" in rendered
        assert "cross" in rendered.lower()

    def test_render_linkedin_no_cross_post_hint(self):
        rendered = render_platform_rules("linkedin")
        assert "LinkedIn" in rendered
        assert "cross" not in rendered.lower()

    def test_render_returns_string(self):
        for platform in PLATFORM_RULES:
            assert isinstance(render_platform_rules(platform), str)

    def test_render_unknown_platform_is_graceful(self):
        rendered = render_platform_rules("snapchat")
        assert "General" in rendered

    def test_render_contains_all_sections(self):
        rendered = render_platform_rules("x")
        assert "Plataforma:" in rendered
        assert "Longitud ideal:" in rendered
        assert "Estilo de hook:" in rendered
        assert "Estructura:" in rendered
        assert "CTA:" in rendered


class TestPlatformRulesDict:
    def test_all_platforms_present(self):
        for platform in ("x", "substack", "linkedin", "tiktok"):
            assert platform in PLATFORM_RULES

    def test_all_rules_are_frozen(self):
        for rule in PLATFORM_RULES.values():
            with pytest.raises((AttributeError, TypeError)):
                rule.name = "hacked"
