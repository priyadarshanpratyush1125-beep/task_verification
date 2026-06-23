import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['nfl_task_verification']
    tasks = await db.tasks.find().to_list(100)
    for t in tasks:
        print(t)

asyncio.run(main())
