from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets
from typing import Any

import jwt
from fastapi import HTTPException, status
from fastapi import Response

PASSWORD_ITERATIONS = int(os.environ.get("ANYHABIT_PASSWORD_ITERATIONS", "200000"))
TOKEN_TTL_SECONDS = int(os.environ.get("ANYHABIT_TOKEN_TTL_SECONDS", str(60 * 60 * 24 * 7)))
SECRET_KEY = os.environ.get("ANYHABIT_SECRET_KEY", "anyhabit-development-secret")
JWT_ALGORITHM = os.environ.get("ANYHABIT_JWT_ALGORITHM", "HS256")
ACCESS_COOKIE_NAME = os.environ.get("ANYHABIT_ACCESS_COOKIE_NAME", "anyhabit_access_token")
COOKIE_SECURE = os.environ.get("ANYHABIT_COOKIE_SECURE", "true").strip().lower() in {"1", "true", "yes", "on"}
COOKIE_SAMESITE = os.environ.get("ANYHABIT_COOKIE_SAMESITE", "lax")
COOKIE_DOMAIN = os.environ.get("ANYHABIT_COOKIE_DOMAIN")
BOOTSTRAP_EMAIL = os.environ.get("ANYHABIT_BOOTSTRAP_EMAIL", "owner@anyhabit.local")
BOOTSTRAP_USERNAME = os.environ.get("ANYHABIT_BOOTSTRAP_USERNAME", "owner")
BOOTSTRAP_PASSWORD = os.environ.get("ANYHABIT_BOOTSTRAP_PASSWORD", "anyhabit")


def hash_password(password: str, salt: str | None = None) -> str:
    salt_bytes = bytes.fromhex(salt) if salt else secrets.token_bytes(16)
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, PASSWORD_ITERATIONS)
    return f"{salt_bytes.hex()}${hash_bytes.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, stored_hash = password_hash.split("$", 1)
    except ValueError:
        return False

    return secrets.compare_digest(hash_password(password, salt_hex).split("$", 1)[1], stored_hash)


def create_access_token(payload: dict[str, Any]) -> str:
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(seconds=TOKEN_TTL_SECONDS)
    token_payload = {
        **payload,
        "iat": issued_at,
        "exp": expires_at,
        "jti": secrets.token_urlsafe(8),
    }
    return jwt.encode(token_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token,
        max_age=TOKEN_TTL_SECONDS,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        domain=COOKIE_DOMAIN,
        path="/",
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
    )
