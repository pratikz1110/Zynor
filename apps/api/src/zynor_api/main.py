from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .version import __version__
from .settings import get_settings


settings = get_settings()
app = FastAPI(title=settings.app_name)

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


@app.get("/", tags=["meta"])
def root():
    return {"name": settings.app_name, "environment": settings.environment}


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/version", tags=["meta"])
def version():
    return {"version": __version__}


