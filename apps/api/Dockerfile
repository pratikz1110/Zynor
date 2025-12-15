# syntax=docker/dockerfile:1

############################
# Stage 1 – Builder
############################
FROM python:3.11-slim AS builder

WORKDIR /app

# Python runtime settings
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install build tools & headers for compiled deps (psycopg, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the API folder (build context is repo root)
COPY apps/api/requirements.txt ./requirements.txt

# Install Python deps into a separate prefix so we can copy them cleanly
RUN pip install --upgrade pip \
    && pip install --prefix=/install -r requirements.txt

COPY apps/api/requirements-test.txt ./requirements-test.txt
RUN pip install --prefix=/install -r requirements-test.txt

# Copy only the API source and migrations into the build context
COPY apps/api/src ./apps/api/src
COPY apps/api/migrations ./apps/api/migrations
COPY apps/core ./apps/core

############################
# Stage 2 – Runtime
############################
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Minimal system deps needed at runtime (keep close to what you had)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m appuser

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code from builder (same layout as in repo)
COPY --from=builder /app/apps/api/src ./apps/api/src
COPY --from=builder /app/apps/api/migrations ./apps/api/migrations
COPY --from=builder /app/apps/core ./apps/core
COPY apps/api/tests ./apps/api/tests

# Ensure Python can import from the repo-style layout (apps.api.src...)
ENV PYTHONPATH=/app

# Create logs directory and give ownership to appuser
RUN mkdir -p /app/logs && chown -R appuser:appuser /app/logs

# Expose FastAPI/Gunicorn port
EXPOSE 8000

# Run as non-root
USER appuser

# Run the API with Gunicorn + Uvicorn worker in production mode
# This matches your existing entrypoint path
CMD ["gunicorn", "apps.api.src.zynor_api.main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--workers", "2"]
