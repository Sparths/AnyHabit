from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parent.parent
ROOT_ENV_FILE = REPO_ROOT / ".env"

# Load the repository-wide .env when present. Existing environment variables
# always win, so an MCP client can override values without editing the file.
load_dotenv(ROOT_ENV_FILE, override=False)


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer, got {raw!r}") from exc


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a number, got {raw!r}") from exc


@dataclass(frozen=True)
class Settings:
    base_url: str
    token: str
    timeout_seconds: float
    allow_destructive: bool
    transport: str
    host: str
    port: int
    path: str
    stateless_http: bool

    @classmethod
    def load(cls) -> "Settings":
        base_url = os.getenv("ANYHABIT_MCP_URL", "").strip().rstrip("/")
        if not base_url:
            raise RuntimeError(
                "ANYHABIT_MCP_URL is not configured. Set it in the repository "
                ".env file or pass it as an environment variable."
            )

        parsed = urlparse(base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise RuntimeError(
                "ANYHABIT_MCP_URL must be an absolute http(s) URL, "
                f"got {base_url!r}."
            )

        transport = os.getenv("ANYHABIT_MCP_TRANSPORT", "stdio").strip().lower()
        if transport not in {"stdio", "streamable-http"}:
            raise RuntimeError(
                "ANYHABIT_MCP_TRANSPORT must be 'stdio' or 'streamable-http'."
            )

        path = os.getenv("ANYHABIT_MCP_PATH", "/mcp").strip() or "/mcp"
        if not path.startswith("/"):
            path = "/" + path

        port = _int_env("ANYHABIT_MCP_PORT", 8001)
        if not (1 <= port <= 65535):
            raise RuntimeError("ANYHABIT_MCP_PORT must be between 1 and 65535.")

        return cls(
            base_url=base_url,
            token=os.getenv("ANYHABIT_MCP_TOKEN", "").strip(),
            timeout_seconds=_float_env("ANYHABIT_MCP_TIMEOUT_SECONDS", 10.0),
            allow_destructive=_bool_env(
                "ANYHABIT_MCP_ALLOW_DESTRUCTIVE", False
            ),
            transport=transport,
            host=os.getenv("ANYHABIT_MCP_HOST", "127.0.0.1").strip()
            or "127.0.0.1",
            port=port,
            path=path,
            stateless_http=_bool_env("ANYHABIT_MCP_STATELESS_HTTP", False),
        )
