# ============================
# Stage 1 — Build environment
# ============================
FROM python:3.11-slim AS builder

# Install system packages needed for building Python deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements from the apps/api folder (build context will be repo root)
COPY apps/api/requirements.txt .

# Install Python dependencies (wheels will be built here)
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# ============================
# Stage 2 — Runtime environment
# ============================
FROM python:3.11-slim

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the entire repo into /app so the path apps.api.src.zynor_api.main:app works
COPY . /app

# Expose FastAPI port
EXPOSE 8000

# Run the API with Gunicorn + Uvicorn worker in production mode
CMD ["gunicorn", "apps.api.src.zynor_api.main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--workers", "2"]

