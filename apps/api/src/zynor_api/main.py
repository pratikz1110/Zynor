from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .version import __version__
from .settings import get_settings
from .routers.technicians.routes import router as technicians_router
from .routers.auth.routes import router as auth_router
from .routers.customers.routes import router as customers_router
from .routers.jobs.routes import router as jobs_router
from apps.core.logging_config import init_logging
from apps.core.request_logging import RequestLoggingMiddleware
from apps.core.error_handlers import unhandled_exception_handler

init_logging()

settings = get_settings()
app = FastAPI(
    title="Zynor API",
    version="0.2.0",
    description="Technicians service (Phase 2 complete: CRUD, filters, sorting, validation)."
)

app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(RequestLoggingMiddleware)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(technicians_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(jobs_router)


@app.get("/", tags=["meta"])
def root():
    return {"name": settings.app_name, "environment": settings.environment}


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/version", tags=["meta"])
def version():
    return {"version": __version__}


@app.get("/_crash")
def force_crash():
    raise ValueError("boom")
