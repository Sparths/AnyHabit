"""Password hashing, JWT issuing, auth cookies and login throttling."""

from __future__ import annotations

import contextlib
import hashlib
import hmac
import os
import secrets
import tempfile
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from fastapi import HTTPException, Request, Response, status

from .database import DATA_DIR

PASSWORD_ITERATIONS = int(os.environ.get("ANYHABIT_PASSWORD_ITERATIONS", "200000"))
TOKEN_TTL_SECONDS = int(os.environ.get("ANYHABIT_TOKEN_TTL_SECONDS", str(60 * 60 * 24 * 7)))
JWT_ALGORITHM = os.environ.get("ANYHABIT_JWT_ALGORITHM", "HS256")
ACCESS_COOKIE_NAME = os.environ.get("ANYHABIT_ACCESS_COOKIE_NAME", "anyhabit_access_token")

# "auto" is the default and the only setting that works out of the box for both
# a plain-HTTP home server and an HTTPS reverse proxy: the flag is set per
# response based on how the request actually arrived.  A Secure cookie sent
# over plain HTTP is silently dropped by the browser, which used to leave
# LAN users unable to log in at all.
COOKIE_SECURE_MODE = os.environ.get("ANYHABIT_COOKIE_SECURE", "auto").strip().lower()
COOKIE_SAMESITE = os.environ.get("ANYHABIT_COOKIE_SAMESITE", "lax").strip().lower()
COOKIE_DOMAIN = os.environ.get("ANYHABIT_COOKIE_DOMAIN") or None

BOOTSTRAP_EMAIL = os.environ.get("ANYHABIT_BOOTSTRAP_EMAIL", "owner@anyhabit.local").strip().lower()
BOOTSTRAP_USERNAME = os.environ.get("ANYHABIT_BOOTSTRAP_USERNAME", "owner")
BOOTSTRAP_PASSWORD = os.environ.get("ANYHABIT_BOOTSTRAP_PASSWORD", "anyhabit")

LOGIN_MAX_ATTEMPTS = int(os.environ.get("ANYHABIT_LOGIN_MAX_ATTEMPTS", "10"))
LOGIN_LOCKOUT_SECONDS = int(os.environ.get("ANYHABIT_LOGIN_LOCKOUT_SECONDS", "300"))


# ---------------------------------------------------------------------------
# Signing key
# ---------------------------------------------------------------------------
# Login sessions are JWTs signed with this key, so anyone who knows it can sign
# in as any user.  ANYHABIT_SECRET_KEY wins when it is set.  Otherwise a random
# key is generated on first start and kept in the data volume, next to the
# database, so it survives restarts and upgrades without any configuration.

SECRET_KEY_FILE = DATA_DIR / "secret_key"

# The fallback key shipped up to 1.5.1.  It is public, so configuring it is
# treated exactly like configuring no key at all.
LEGACY_PUBLIC_SECRET = "anyhabit-development-secret"


def _read_secret_key(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""


def _load_or_create_secret_key(path: Path) -> tuple[str, bool]:
    """Return ``(key, created)``, generating and storing a key if there is none."""
    existing = _read_secret_key(path)
    if existing:
        return existing, False

    key = secrets.token_hex(32)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Written in full to a private temp file first (mkstemp creates it 0600)
    # and only then put in place, so no process ever reads a half-written key.
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=".secret_key-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(key + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        try:
            # Refuses to overwrite: if another worker got there first, its key wins.
            os.link(tmp_name, path)
        except FileExistsError:
            if not _read_secret_key(path):
                # An empty file left behind by an interrupted earlier start.
                os.replace(tmp_name, path)
        except OSError:
            # Filesystems without hard links, such as some network shares.
            os.replace(tmp_name, path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)

    stored = _read_secret_key(path)
    if not stored:
        raise OSError(f"{path} is still empty after writing it")
    return stored, stored == key


def _resolve_secret_key(key_file: Path) -> tuple[str, str, str | None]:
    """Return ``(key, source, warning)``.

    ``source`` is ``"env"``, ``"file"`` (an existing stored key), ``"created"``
    (a key generated just now) or ``"ephemeral"`` (could not be stored, so it
    only lasts until the next restart).  It never falls back to a known key.
    """
    warning = None
    configured = os.environ.get("ANYHABIT_SECRET_KEY", "").strip()
    if configured == LEGACY_PUBLIC_SECRET:
        configured = ""
        warning = (
            "ANYHABIT_SECRET_KEY is set to the old built-in development key, which is public and "
            "would let anyone forge a login. It is ignored; remove it from your .env."
        )
    if configured:
        return configured, "env", None

    try:
        key, created = _load_or_create_secret_key(key_file)
    except OSError as exc:
        return secrets.token_hex(32), "ephemeral", (
            f"Could not store a signing key in {key_file} ({exc}), so a temporary one is used and "
            "everyone is signed out whenever AnyHabit restarts. Set ANYHABIT_SECRET_KEY to avoid this."
        )
    return key, ("created" if created else "file"), warning


# Logged by main.py once logging is configured.
SECRET_KEY, SECRET_KEY_SOURCE, SECRET_KEY_WARNING = _resolve_secret_key(SECRET_KEY_FILE)


# ---------------------------------------------------------------------------
# Passwords
# ---------------------------------------------------------------------------


def hash_password(password: str, salt: str | None = None) -> str:
    salt_bytes = bytes.fromhex(salt) if salt else secrets.token_bytes(16)
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, PASSWORD_ITERATIONS)
    return f"{salt_bytes.hex()}${hash_bytes.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, stored_hash = password_hash.split("$", 1)
    except (ValueError, AttributeError):
        return False

    try:
        candidate = hash_password(password, salt_hex).split("$", 1)[1]
    except ValueError:
        return False

    return secrets.compare_digest(candidate, stored_hash)


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------


def create_access_token(payload: dict[str, Any]) -> str:
    issued_at = datetime.now(timezone.utc)
    token_payload = {
        **payload,
        "iat": issued_at,
        "exp": issued_at + timedelta(seconds=TOKEN_TTL_SECONDS),
        "jti": secrets.token_urlsafe(8),
    }
    return jwt.encode(token_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session expired. Please sign in again."
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
        ) from exc


# ---------------------------------------------------------------------------
# Personal access tokens
# ---------------------------------------------------------------------------

# Recognisable in logs and greppable in a config file, the way `ghp_` or `sk-`
# are. Also lets the auth dependency tell an API token from a JWT instantly.
API_TOKEN_PREFIX = "ahb_"
API_TOKEN_BYTES = 32
API_TOKEN_PREVIEW_LENGTH = 12


def generate_api_token() -> tuple[str, str, str]:
    """Return ``(plaintext, hash, preview)`` for a new token.

    Only the hash is stored. The plaintext is returned to the caller once and
    is unrecoverable afterwards — which is the point.
    """
    plaintext = f"{API_TOKEN_PREFIX}{secrets.token_urlsafe(API_TOKEN_BYTES)}"
    return plaintext, hash_api_token(plaintext), plaintext[:API_TOKEN_PREVIEW_LENGTH]


def hash_api_token(plaintext: str) -> str:
    """Hash a token for storage and lookup.

    A plain SHA-256 rather than PBKDF2: these are 256 bits of entropy from a
    CSPRNG, not a human-chosen password, so there is nothing to brute force,
    and lookup has to be a single indexed query on every API request.
    """
    return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()


def looks_like_api_token(value: str) -> bool:
    return value.startswith(API_TOKEN_PREFIX)


# ---------------------------------------------------------------------------
# Webhook signing
# ---------------------------------------------------------------------------


def generate_webhook_secret() -> str:
    return secrets.token_urlsafe(24)


def sign_webhook_payload(secret: str, body: bytes) -> str:
    """HMAC-SHA256 of the body, so a receiver can verify the call came from us."""
    return hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


# ---------------------------------------------------------------------------
# Cookies
# ---------------------------------------------------------------------------


def _request_is_https(request: Request | None) -> bool:
    if request is None:
        return False

    # Trust the proxy header first: nginx terminates TLS and forwards over
    # plain HTTP, so request.url.scheme alone would always read "http".
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    if forwarded_proto:
        return forwarded_proto.split(",")[0].strip().lower() == "https"

    return request.url.scheme == "https"


def should_use_secure_cookie(request: Request | None) -> bool:
    if COOKIE_SECURE_MODE in {"1", "true", "yes", "on"}:
        return True
    if COOKIE_SECURE_MODE in {"0", "false", "no", "off"}:
        return False
    return _request_is_https(request)


def set_auth_cookie(response: Response, token: str, request: Request | None = None) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token,
        max_age=TOKEN_TTL_SECONDS,
        httponly=True,
        secure=should_use_secure_cookie(request),
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        path="/",
    )


def clear_auth_cookie(response: Response, request: Request | None = None) -> None:
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        domain=COOKIE_DOMAIN,
        path="/",
        samesite=COOKIE_SAMESITE,
        secure=should_use_secure_cookie(request),
    )


# ---------------------------------------------------------------------------
# Login throttling
# ---------------------------------------------------------------------------


class LoginThrottle:
    """Per-identifier failed-login counter with a cooling-off period.

    Deliberately in-process: AnyHabit runs as a single container, and this only
    needs to blunt password guessing, not survive a restart.
    """

    def __init__(self, max_attempts: int, lockout_seconds: int) -> None:
        self._max_attempts = max_attempts
        self._lockout_seconds = lockout_seconds
        self._failures: dict[str, tuple[int, float]] = {}
        self._lock = threading.Lock()

    def _prune(self, now: float) -> None:
        expired = [key for key, (_, last_seen) in self._failures.items() if now - last_seen > self._lockout_seconds]
        for key in expired:
            self._failures.pop(key, None)

    def seconds_remaining(self, key: str) -> int:
        if self._max_attempts <= 0:
            return 0

        now = time.monotonic()
        with self._lock:
            self._prune(now)
            attempts, last_seen = self._failures.get(key, (0, 0.0))

        if attempts < self._max_attempts:
            return 0
        return max(0, int(self._lockout_seconds - (now - last_seen)))

    def record_failure(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._prune(now)
            attempts, _ = self._failures.get(key, (0, 0.0))
            self._failures[key] = (attempts + 1, now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)


login_throttle = LoginThrottle(LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS)


def throttle_key(request: Request | None, identifier: str) -> str:
    client_host = request.client.host if request and request.client else "unknown"
    return f"{client_host}:{identifier.strip().lower()}"
