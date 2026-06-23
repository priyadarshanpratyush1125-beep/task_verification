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
            serverSelectionTimeoutMS=2000
        )
        # Check if DB is up
        await real_client.server_info()
        db.client = real_client
        logger.info("Successfully connected to real MongoDB!")
    except Exception as e:
        logger.warning(f"Failed to connect to real MongoDB. Error: {e}")
        logger.warning("FALLING BACK TO IN-MEMORY MONGOMOCK-MOTOR FOR TESTING!")
        from mongomock_motor import AsyncMongoMockClient
        db.client = AsyncMongoMockClient()
        # Automatically seed dummy employees for testing
        test_db = get_database()
        from app.security import get_password_hash
        from datetime import datetime
        
        # Check if already seeded
        if await test_db.users.count_documents({"role": "employee"}) == 0:
            sample_employees = [
                {
                    "name": "Jane Doe (Maintenance)",
                    "email": "jane@company.com",
                    "hashed_password": get_password_hash("password123"),
                    "role": "employee",
                    "created_at": datetime.utcnow()
                },
                {
                    "name": "Mark Smith (Electrical)",
                    "email": "mark@company.com",
                    "hashed_password": get_password_hash("password123"),
                    "role": "employee",
                    "created_at": datetime.utcnow()
                },
                {
                    "name": "Sarah Connor (Operations)",
                    "email": "sarah@company.com",
                    "hashed_password": get_password_hash("password123"),
                    "role": "employee",
                    "created_at": datetime.utcnow()
                },
                {
                    "name": "David Miller (Mechanical)",
                    "email": "david@company.com",
                    "hashed_password": get_password_hash("password123"),
                    "role": "employee",
                    "created_at": datetime.utcnow()
                }
            ]
            await test_db.users.insert_many(sample_employees)

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
