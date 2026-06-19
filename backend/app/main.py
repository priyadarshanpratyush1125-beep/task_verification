import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import connect_to_mongo, close_mongo_connection
from app.config.settings import settings

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from app.routes import auth, fields, tasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    await connect_to_mongo()
    yield
    # Shutdown event
    await close_mongo_connection()

app = FastAPI(
    title="Smart Employee Task Verification Portal API",
    description="API for managing employee tasks and verifications",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth.router)
app.include_router(fields.router)
app.include_router(tasks.router)

@app.get("/api/health", tags=["Health Check"])
async def health_check():
    return {"status": "ok", "message": "The system is healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
