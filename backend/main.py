import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .migrations import run_startup_migrations
from .routers import auth_router, dashboard_router, groups_router, journals_router, logs_router, trackers_router

models.Base.metadata.create_all(bind=engine)
run_startup_migrations()

app = FastAPI(title="AnyHabit API")


def _get_cors_origins() -> list[str]:
    raw_origins = os.environ.get(
        "ANYHABIT_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip() and origin.strip() != "*"]


cors_origins = _get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to AnyHabit! The Server is running."}

app.include_router(trackers_router)
app.include_router(journals_router)
app.include_router(logs_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(groups_router)