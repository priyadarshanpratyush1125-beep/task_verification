import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

logger = logging.getLogger(__name__)

class Database:
    client = None

db = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        real_client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000
        )
        # Check if DB is up
        await real_client.server_info()
        db.client = real_client
        logger.info("Successfully connected to real MongoDB!")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to connect to MongoDB. Error: {e}")
        logger.error("Please ensure mongod.exe is running!")
        raise e

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client:
        try:
            db.client.close()
        except AttributeError:
            pass
        logger.info("Successfully closed MongoDB connection!")

def get_database():
    return db.client["task_verification_db"]
