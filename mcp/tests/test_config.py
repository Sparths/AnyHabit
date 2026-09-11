from __future__ import annotations

import os

import pytest

from config import Settings


@pytest.fixture(autouse=True)
def clean_mcp_env(monkeypatch: pytest.MonkeyPatch):
    names = [
        "ANYHABIT_MCP_URL",
        "ANYHABIT_MCP_TOKEN",
        "ANYHABIT_MCP_TIMEOUT_SECONDS",
        "ANYHABIT_MCP_ALLOW_DESTRUCTIVE",
        "ANYHABIT_MCP_TRANSPORT",
        "ANYHABIT_MCP_HOST",
        "ANYHABIT_MCP_PORT",
        "ANYHABIT_MCP_PATH",
        "ANYHABIT_MCP_STATELESS_HTTP",
    ]
    for name in names:
        monkeypatch.delenv(name, raising=False)


def test_requires_url(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ANYHABIT_MCP_URL", "")
    with pytest.raises(RuntimeError, match="ANYHABIT_MCP_URL"):
        Settings.load()


def test_loads_stdio_defaults(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ANYHABIT_MCP_URL", "http://localhost:8080/")
    settings = Settings.load()

    assert settings.base_url == "http://localhost:8080"
    assert settings.transport == "stdio"
    assert settings.allow_destructive is False
    assert settings.path == "/mcp"


def test_http_settings(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ANYHABIT_MCP_URL", "https://habit.example.com")
    monkeypatch.setenv("ANYHABIT_MCP_TRANSPORT", "streamable-http")
    monkeypatch.setenv("ANYHABIT_MCP_PORT", "9000")
    monkeypatch.setenv("ANYHABIT_MCP_PATH", "ai")
    monkeypatch.setenv("ANYHABIT_MCP_ALLOW_DESTRUCTIVE", "true")

    settings = Settings.load()

    assert settings.transport == "streamable-http"
    assert settings.port == 9000
    assert settings.path == "/ai"
    assert settings.allow_destructive is True
