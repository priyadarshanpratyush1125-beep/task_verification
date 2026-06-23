from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class RoleEnum(str, Enum):
    admin = "admin"
    employee = "employee"

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    role: RoleEnum = RoleEnum.employee

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)

class PasswordUpdate(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
