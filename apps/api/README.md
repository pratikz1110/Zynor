# Zynor API (FastAPI)

## Local run

### Quick Start

Activate your venv, then run from `apps/api/`:

**Windows:**
```powershell
.\run-dev.ps1
```

**macOS/Linux:**
```bash
chmod +x run-dev.sh && ./run-dev.sh
```

### Custom Port

**Windows:**
```powershell
$env:PORT=9000; .\run-dev.ps1
```

**macOS/Linux:**
```bash
PORT=9000 ./run-dev.sh
```

### Manual Start (without scripts)

From repo root:
```bash
cd apps/api
uvicorn zynor_api.main:app --reload --port 8000
```

### API Docs

Open http://localhost:8000/docs

### Notes

The `run-dev.ps1` and `run-dev.sh` scripts automatically set `PYTHONPATH` to `apps/api/src` so the imports work correctly.

