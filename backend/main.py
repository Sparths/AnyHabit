"""FastAPI application entry point."""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import schemas
from .migrations import prepare_database
from .routers import (
    activity_router,
    auth_router,
    dashboard_router,
    developer_router,
    export_router,
    groups_router,
    import_router,
    legacy_import_router,
    journals_router,
    logs_router,
    trackers_router,
)
from .security import SECRET_KEY_FILE, SECRET_KEY_SOURCE, SECRET_KEY_WARNING
from .version import APP_NAME, APP_VERSION, SCHEMA_VERSION

logging.basicConfig(
    level=os.environ.get("ANYHABIT_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("anyhabit")

# Creates the schema, applies any pending migrations and — on a real upgrade —
# writes a rollback snapshot first.  Runs before the app accepts traffic.
MIGRATION_REPORT = prepare_database()

if SECRET_KEY_WARNING:
    logger.warning(SECRET_KEY_WARNING)
if SECRET_KEY_SOURCE == "created":
    logger.info("Generated a signing key for login sessions and stored it in %s.", SECRET_KEY_FILE)

app = FastAPI(
    title=f"{APP_NAME} API",
    version=APP_VERSION,
    description=(
        "Self-hosted habit tracking. Every endpoint below is authenticated with the "
        "session cookie set by /auth/login, or with an `Authorization: Bearer` token."
    ),
)


def _get_cors_origins() -> list[str]:
    raw_origins = os.environ.get(
        "ANYHABIT_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip() and origin.strip() != "*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Turn Pydantic's nested error payload into one readable sentence.

    The default shape renders in the UI as a wall of JSON; the API contract is
    unchanged for machine clients because ``errors`` still carries the detail.
    """
    messages = []
    for error in exc.errors():
        field = ".".join(str(part) for part in error.get("loc", ()) if part not in {"body", "query", "path"})
        message = error.get("msg", "Invalid value")
        message = message.removeprefix("Value error, ")
        messages.append(f"{field}: {message}" if field else message)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        # jsonable_encoder because Pydantic puts the original exception object
        # in each error's "ctx", which json.dumps cannot serialise.
        content=jsonable_encoder(
            {"detail": "; ".join(messages) or "Invalid request", "errors": exc.errors()}
        ),
    )


@app.get("/", tags=["system"])
def read_root():
    return {"message": f"Welcome to {APP_NAME}! The Server is running.", "version": APP_VERSION}


@app.get("/health", response_model=schemas.SystemInfo, tags=["system"])
def health():
    """Liveness plus a summary of what the last boot did to the database."""
    return schemas.SystemInfo(
        name=APP_NAME,
        version=APP_VERSION,
        schema_version=SCHEMA_VERSION,
        database_ready=True,
        migrations_applied_on_boot=list(MIGRATION_REPORT.get("applied", [])),
        backup_created_on_boot=MIGRATION_REPORT.get("backup"),
    )


@app.get("/version", tags=["system"])
def version():
    return {"name": APP_NAME, "version": APP_VERSION, "schema_version": SCHEMA_VERSION}


app.include_router(trackers_router)
app.include_router(journals_router)
app.include_router(logs_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(export_router)
app.include_router(import_router)
app.include_router(legacy_import_router)
app.include_router(developer_router)
app.include_router(activity_router)
