import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import os
import pymongo
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.config.settings import settings

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from app.routes import auth, fields, tasks, users, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    await connect_to_mongo()
    yield
    # Shutdown event
    await close_mongo_connection()

app = FastAPI(
    title="Smart Employee Task Verification Portal",
    description="Backend API for task management and verification",
    version="1.0.0",
    lifespan=lifespan
)

# Global CORS Middleware
# Configure this via FRONTEND_URL in production, fallback to generic dev ones
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Error Handling Middleware
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Catch DB connectivity issues explicitly
    if isinstance(exc, (pymongo.errors.ConnectionFailure, pymongo.errors.ServerSelectionTimeoutError)):
        return JSONResponse(
            status_code=503,
            content={"detail": "Database connection unavailable. Please try again later."}
        )
    # Generic unhandled exception fallback
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"}
    )

app.include_router(auth.router)
app.include_router(fields.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(analytics.router)

@app.get("/api/health", tags=["Health Check"])
async def health_check():
    return {"status": "ok", "message": "The system is healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
