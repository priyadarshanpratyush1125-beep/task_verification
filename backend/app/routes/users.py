from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List
from app.models.user import UserResponse, RoleEnum, UserInDB, UserUpdate, PasswordUpdate
from app.dependencies import require_role, get_current_user
from app.database import get_database
from app.security import verify_password, get_password_hash
from bson import ObjectId

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/employees", response_model=List[UserResponse])
async def get_all_employees(
    current_user: UserInDB = Depends(require_role([RoleEnum.admin]))
) -> Any:
    db = get_database()
    cursor = db.users.find({"role": RoleEnum.employee})
    employees = []
    async for emp in cursor:
        emp["id"] = str(emp.pop("_id"))
        employees.append(UserResponse(**emp))
    return employees

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)) -> Any:
    # current_user from get_current_user is already a dict without _id if processed, 
    # but let's re-fetch from db to be safe and accurate.
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user.pop("_id"))
    return UserResponse(**user)

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
) -> Any:
    db = get_database()
    
    result = await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"name": update_data.name}}
    )
    
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user.pop("_id"))
    return UserResponse(**user)

@router.put("/password")
async def update_my_password(
    password_data: PasswordUpdate,
    current_user: dict = Depends(get_current_user)
) -> Any:
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify current password
    if not verify_password(password_data.current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    # Update to new password
    hashed_password = get_password_hash(password_data.new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    return {"message": "Password updated successfully"}
