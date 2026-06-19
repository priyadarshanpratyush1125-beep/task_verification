from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Any, List, Optional
from bson import ObjectId
from datetime import datetime
from app.models.task import TaskCreate, TaskResponse, TaskStatusEnum, TaskPriorityEnum
from app.models.user import UserInDB, RoleEnum
from app.dependencies import get_current_active_user, require_role
from app.database import get_database

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: UserInDB = Depends(require_role([RoleEnum.admin]))
) -> Any:
    db = get_database()
    
    # Validate assigned_to exists and is an employee
    try:
        user_obj_id = ObjectId(task_in.assigned_to)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assigned_to User ID format")
        
    employee_doc = await db.users.find_one({"_id": user_obj_id})
    if not employee_doc:
        raise HTTPException(status_code=404, detail="Assigned user not found")
        
    if employee_doc.get("role") != RoleEnum.employee:
        raise HTTPException(status_code=400, detail="Tasks can only be assigned to employees")
        
    task_dict = task_in.model_dump()
    task_dict["created_at"] = datetime.utcnow()
    
    result = await db.tasks.insert_one(task_dict)
    
    created_task = await db.tasks.find_one({"_id": result.inserted_id})
    created_task["_id"] = str(created_task["_id"])
    return TaskResponse(**created_task)

@router.get("/admin", response_model=List[TaskResponse])
async def get_all_tasks_admin(
    status_filter: Optional[TaskStatusEnum] = Query(None, alias="status"),
    priority_filter: Optional[TaskPriorityEnum] = Query(None, alias="priority"),
    current_user: UserInDB = Depends(require_role([RoleEnum.admin]))
) -> Any:
    db = get_database()
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    if priority_filter:
        query["priority"] = priority_filter
        
    cursor = db.tasks.find(query).sort("created_at", -1)
    tasks = []
    async for task in cursor:
        task["_id"] = str(task["_id"])
        tasks.append(TaskResponse(**task))
        
    return tasks

@router.get("/employee", response_model=List[TaskResponse])
async def get_employee_tasks(
    status_filter: Optional[TaskStatusEnum] = Query(None, alias="status"),
    current_user: UserInDB = Depends(require_role([RoleEnum.employee]))
) -> Any:
    db = get_database()
    
    query = {"assigned_to": current_user.id}
    if status_filter:
        query["status"] = status_filter
        
    cursor = db.tasks.find(query).sort("created_at", -1)
    tasks = []
    async for task in cursor:
        task["_id"] = str(task["_id"])
        tasks.append(TaskResponse(**task))
        
    return tasks
