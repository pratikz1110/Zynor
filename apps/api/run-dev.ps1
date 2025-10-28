$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONPATH = Join-Path $here "src"
if (-not $env:PORT) { $env:PORT = "8000" }
Write-Host "PYTHONPATH = $env:PYTHONPATH"
Write-Host "Starting Uvicorn on http://127.0.0.1:$env:PORT ..."
uvicorn zynor_api.main:app --reload --port $env:PORT
