from fastapi import APIRouter, Depends
from typing import Any, Dict
from app.models.user import UserInDB, RoleEnum
from app.dependencies import require_role
from app.database import get_database

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary", response_model=Dict[str, Any])
async def get_analytics_summary(
    current_user: UserInDB = Depends(require_role([RoleEnum.admin]))
) -> Any:
    db = get_database()
    
    # Total tasks
    total_tasks = await db.tasks.count_documents({})
    
    # Status breakdown
    pipeline_status = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_cursor = db.tasks.aggregate(pipeline_status)
    status_counts = {"Pending": 0, "Submitted": 0, "Approved": 0, "Rejected": 0}
    
    approved_count = 0
    async for doc in status_cursor:
        status_name = doc["_id"]
        count = doc["count"]
        if status_name in status_counts:
            status_counts[status_name] = count
        if status_name == "Approved":
            approved_count = count
            
    # Completion rate
    completion_rate = 0
    if total_tasks > 0:
        completion_rate = round((approved_count / total_tasks) * 100, 1)
        
    # Department breakdown
    pipeline_dept = [
        {"$group": {"_id": "$department", "count": {"$sum": 1}}}
    ]
    dept_cursor = db.tasks.aggregate(pipeline_dept)
    department_breakdown = []
    async for doc in dept_cursor:
        if doc["_id"]:
            department_breakdown.append({
                "name": doc["_id"],
                "value": doc["count"]
            })
            
    return {
        "total_tasks": total_tasks,
        "completion_rate": completion_rate,
        "status_counts": status_counts,
        "department_breakdown": department_breakdown
    }
