import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def main():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['task_verification_db']
    users = await db.users.find().to_list(100)
    for u in users:
        if u['role'] == 'employee':
            await db.tasks.insert_one({
                'title': 'Welcome to the Team!',
                'description': f'This is an assigned task for {u["email"]}. Please review your dashboard.',
                'assigned_to': str(u['_id']),
                'department': 'HR',
                'status': 'Pending',
                'priority': 'High',
                'remarks': '',
                'proof_image': '',
                'dynamic_data': {},
                'created_at': datetime.utcnow()
            })
    print('Tasks assigned to all employees!')

asyncio.run(main())
