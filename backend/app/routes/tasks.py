from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from typing import Any, List, Optional
from bson import ObjectId
from datetime import datetime
import json
import cloudinary
import cloudinary.uploader
from app.models.task import TaskCreate, TaskResponse, TaskStatusEnum, TaskPriorityEnum
from app.models.user import UserInDB, RoleEnum
from app.dependencies import get_current_active_user, require_role
from app.database import get_database
from app.config.settings import settings

# Configure cloudinary using the CLOUDINARY_URL from settings if available
if settings.CLOUDINARY_URL:
    cloudinary.config()

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
    created_task["id"] = str(created_task.pop("_id"))
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
        task["id"] = str(task.pop("_id"))
        tasks.append(TaskResponse(**task))
        
    return tasks

@router.get("/employee", response_model=List[TaskResponse])
async def get_employee_tasks(
    status_filter: Optional[TaskStatusEnum] = Query(None, alias="status"),
    current_user: UserInDB = Depends(require_role([RoleEnum.employee]))
) -> Any:
    db = get_database()
    
    query = {"assigned_to": str(current_user.id)}
    if status_filter:
        query["status"] = status_filter
        
    cursor = db.tasks.find(query).sort("created_at", -1)
    tasks = []
    async for task in cursor:
        task["id"] = str(task.pop("_id"))
        tasks.append(TaskResponse(**task))
        
    return tasks

@router.post("/{task_id}/submit", response_model=TaskResponse)
async def submit_task(
    task_id: str,
    proof_image: UploadFile = File(...),
    remarks: Optional[str] = Form(""),
    dynamic_data: Optional[str] = Form("{}"),
    current_user: UserInDB = Depends(require_role([RoleEnum.employee]))
) -> Any:
    db = get_database()
    
    try:
        task_obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Task ID format")
        
    # Check if task exists and belongs to the employee
    task_doc = await db.tasks.find_one({"_id": task_obj_id})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_doc.get("assigned_to") != str(current_user.id):
        raise HTTPException(status_code=403, detail="You can only submit your own tasks")
        
    # Parse dynamic data
    try:
        parsed_dynamic_data = json.loads(dynamic_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="dynamic_data must be a valid JSON string")
        
    # Upload to cloudinary
    try:
        upload_result = cloudinary.uploader.upload(proof_image.file)
        secure_url = upload_result.get("secure_url")
    except Exception as e:
        # If cloudinary fails (e.g. no credentials), we can simulate or throw
        if not settings.CLOUDINARY_URL:
            # For local testing without Cloudinary credentials, we can just save a mock URL
            secure_url = "https://mock-cloudinary-url.com/proof.jpg"
        else:
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
            
    # Update the task
    update_data = {
        "status": TaskStatusEnum.submitted,
        "proof_image": secure_url,
        "remarks": remarks,
        "dynamic_data": parsed_dynamic_data
    }
    
    await db.tasks.update_one({"_id": task_obj_id}, {"$set": update_data})
    
    # Return updated task
    updated_task = await db.tasks.find_one({"_id": task_obj_id})
    updated_task["id"] = str(updated_task.pop("_id"))
    return TaskResponse(**updated_task)
from pydantic import BaseModel
from typing import Optional

class TaskReviewSchema(BaseModel):
    status: TaskStatusEnum
    admin_remarks: Optional[str] = ""

@router.put("/{task_id}/review", response_model=TaskResponse)
async def review_task(
    task_id: str,
    review_data: TaskReviewSchema,
    current_user: UserInDB = Depends(require_role([RoleEnum.admin]))
) -> Any:
    db = get_database()
    
    try:
        task_obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Task ID format")
        
    task_doc = await db.tasks.find_one({"_id": task_obj_id})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if review_data.status not in [TaskStatusEnum.approved, TaskStatusEnum.rejected]:
        raise HTTPException(status_code=400, detail="Invalid status for review")

    update_data = {
        "status": review_data.status,
        "admin_remarks": review_data.admin_remarks,
        "verified_at": datetime.utcnow() if review_data.status == TaskStatusEnum.approved else None
    }
    
    await db.tasks.update_one({"_id": task_obj_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"_id": task_obj_id})
    updated_task["id"] = str(updated_task.pop("_id"))
    return TaskResponse(**updated_task)
