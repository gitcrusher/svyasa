"""CampusConnect application entrypoint.

This module re-exports the FastAPI app from `main.py` for backwards compatibility
with `python app.py` and `uvicorn app:app`.
"""

import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of where python was invoked from
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=True)
