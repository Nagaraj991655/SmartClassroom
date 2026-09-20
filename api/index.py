import sys
from pathlib import Path

# In Vercel serverless environment, index.py is at api/index.py
# Resolve repository root and backend directory into sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app

__all__ = ["app"]
