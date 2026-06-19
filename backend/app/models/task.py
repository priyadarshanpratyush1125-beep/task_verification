from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    assigned_to: str # User ID
    status: str = "Pending"
    priority: str = "High"
    remarks: Optional[str] = ""
    proof_image: Optional[str] = ""
    dynamic_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str = Field(alias="_id")
    created_at: datetime
    
    class Config:
        populate_by_name = True
