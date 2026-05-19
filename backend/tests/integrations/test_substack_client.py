"""Regression tests for SubstackClient SSRF protection (C1)."""
import pytest

from app.integrations.substack.client import SubstackClient


class TestSubstackHostValidation:
    """Tests for _validate_host SSRF protection."""

    @pytest.mark.parametrize("url", [
        "https://example.substack.com",
        "https://substack.com/feed",
        "https://newsletter.example.com/feed",
        "http://valid-public-host.com",
    ])
    def test_valid_public_urls_pass(self, url: str) -> None:
        """Public HTTPS URLs should pass validation."""
        SubstackClient._validate_host(url)

    @pytest.mark.parametrize("url", [
        "http://localhost",
        "http://localhost:8000",
        "http://127.0.0.1",
        "http://127.0.0.1:5432",
        "http://0.0.0.0",
        "http://[::1]",
    ])
    def test_localhost_rejected(self, url: str) -> None:
        """Localhost and loopback addresses must be rejected."""
        with pytest.raises(ValueError, match="Host not allowed"):
            SubstackClient._validate_host(url)

    @pytest.mark.parametrize("url", [
        "http://10.0.0.1",
        "http://10.255.255.255",
        "http://172.16.0.1",
        "http://172.31.255.255",
        "http://192.168.0.1",
        "http://192.168.255.255",
        "http://169.254.0.1",
        "http://169.254.255.255",
    ])
    def test_private_ips_rejected(self, url: str) -> None:
        """Private IP ranges must be rejected."""
        with pytest.raises(ValueError, match="Host not allowed"):
            SubstackClient._validate_host(url)

    @pytest.mark.parametrize("url", [
        "ftp://example.com",
        "file:///etc/passwd",
        "gopher://localhost",
    ])
    def test_non_http_schemes_rejected(self, url: str) -> None:
        """Non-HTTP(S) schemes must be rejected."""
        with pytest.raises(ValueError, match="Invalid URL scheme"):
            SubstackClient._validate_host(url)

    def test_no_hostname_rejected(self) -> None:
        """URLs without a hostname must be rejected."""
        with pytest.raises(ValueError, match="no valid hostname"):
            SubstackClient._validate_host("http:///path-only")
