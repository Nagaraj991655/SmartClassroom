import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.helper.storage import ensure_storage_directories
from app.model.seed_model import run_seed
from app.routes import auth, admin, teacher, student, files

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smartclassroom.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Initializing SmartClassroom application...")
    ensure_storage_directories()
    run_seed()
    logger.info("Storage directories and initial database seeds ready.")
    yield
    # Shutdown tasks
    logger.info("Shutting down SmartClassroom application.")

app = FastAPI(
    title="SmartClassroom API",
    description="Backend API for SmartClassroom (University College of Jaffna) with JWT Auth, Role RBAC, Google App Password Email, and Dual File Storage.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(files.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "SmartClassroom API v1.0",
        "institution": "University College of Jaffna",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
