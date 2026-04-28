from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from fastapi import HTTPException, status

PASSWORD_ITERATIONS = int(os.environ.get("ANYHABIT_PASSWORD_ITERATIONS", "200000"))
TOKEN_TTL_SECONDS = int(os.environ.get("ANYHABIT_TOKEN_TTL_SECONDS", str(60 * 60 * 24 * 7)))
SECRET_KEY = os.environ.get("ANYHABIT_SECRET_KEY", "anyhabit-development-secret")
BOOTSTRAP_EMAIL = os.environ.get("ANYHABIT_BOOTSTRAP_EMAIL", "owner@anyhabit.local")
BOOTSTRAP_USERNAME = os.environ.get("ANYHABIT_BOOTSTRAP_USERNAME", "owner")
BOOTSTRAP_PASSWORD = os.environ.get("ANYHABIT_BOOTSTRAP_PASSWORD", "anyhabit")


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(f"{data}{padding}".encode("utf-8"))


def hash_password(password: str, salt: str | None = None) -> str:
    salt_bytes = bytes.fromhex(salt) if salt else secrets.token_bytes(16)
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, PASSWORD_ITERATIONS)
    return f"{salt_bytes.hex()}${hash_bytes.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, stored_hash = password_hash.split("$", 1)
    except ValueError:
        return False

    return hmac.compare_digest(hash_password(password, salt_hex).split("$", 1)[1], stored_hash)


def create_access_token(payload: dict[str, Any]) -> str:
    token_payload = {
        **payload,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
        "nonce": secrets.token_urlsafe(8),
    }
    encoded_payload = _base64url_encode(json.dumps(token_payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = hmac.new(SECRET_KEY.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256).digest()
    return f"{encoded_payload}.{_base64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

    expected_signature = hmac.new(
        SECRET_KEY.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256
    ).digest()
    if not hmac.compare_digest(_base64url_encode(expected_signature), encoded_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

    try:
        payload = json.loads(_base64url_decode(encoded_payload).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token expired")

    return payload
