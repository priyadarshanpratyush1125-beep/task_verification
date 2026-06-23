import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['nfl_task_verification']
    user = await db.users.find_one({"role": "employee"})
    print("User ID:", user['_id'])
    print("User ID str:", str(user['_id']))
    tasks = await db.tasks.find({"assigned_to": str(user['_id'])}).to_list(100)
    print("Tasks found:", len(tasks))

asyncio.run(main())
