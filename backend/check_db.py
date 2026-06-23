import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['task_verification_db']
    users = await db.users.find().to_list(100)
    print("Users:")
    for u in users:
        print(f" - {u['email']} | ID: {str(u['_id'])}")
    
    tasks = await db.tasks.find().to_list(100)
    print("\nTasks:")
    for t in tasks:
        print(f" - {t['title']} assigned to {t['assigned_to']}")

asyncio.run(main())
