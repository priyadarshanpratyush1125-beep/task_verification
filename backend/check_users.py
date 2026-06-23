import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['nfl_task_verification']
    users = await db.users.find().to_list(100)
    for u in users:
        print(u["_id"], u["role"], u["email"])

asyncio.run(main())
