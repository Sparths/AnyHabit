from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .migrations import run_startup_migrations
from .routers import dashboard_router, journals_router, logs_router, trackers_router

models.Base.metadata.create_all(bind=engine)
run_startup_migrations()

app = FastAPI(title="AnyHabit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to AnyHabit! The Server is running."}

app.include_router(trackers_router)
app.include_router(journals_router)
app.include_router(logs_router)
app.include_router(dashboard_router)