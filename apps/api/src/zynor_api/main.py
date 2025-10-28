from fastapi import FastAPI
from .version import __version__
from .settings import get_settings


settings = get_settings()
app = FastAPI(title=settings.app_name)


@app.get("/", tags=["meta"])
def root():
    return {"name": settings.app_name, "environment": settings.environment}


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/version", tags=["meta"])
def version():
    return {"version": __version__}


