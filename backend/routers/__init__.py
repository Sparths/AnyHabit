from .dashboard import router as dashboard_router
from .journals import router as journals_router
from .logs import router as logs_router
from .trackers import router as trackers_router

__all__ = ["trackers_router", "journals_router", "logs_router", "dashboard_router"]
