#!/usr/bin/env bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export PYTHONPATH="$DIR/src"
: "${PORT:=8000}"
echo "PYTHONPATH=$PYTHONPATH"
echo "Starting Uvicorn on http://127.0.0.1:$PORT ..."
uvicorn zynor_api.main:app --reload --port "$PORT"
