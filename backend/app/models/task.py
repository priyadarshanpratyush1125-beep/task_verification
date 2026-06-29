from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class TaskStatusEnum(str, Enum):
    pending = "Pending"
    submitted = "Submitted"
    approved = "Approved"
    rejected = "Rejected"

class TaskPriorityEnum(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    assigned_to: str # User ID
    department: str
    status: TaskStatusEnum = TaskStatusEnum.pending
    priority: TaskPriorityEnum = TaskPriorityEnum.high
    remarks: Optional[str] = ""
    proof_image: Optional[str] = ""
    custom_fields: Optional[list[dict]] = Field(default_factory=list)
    dynamic_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str = Field(alias="_id")
    created_at: datetime
    
    class Config:
        populate_by_name = True
