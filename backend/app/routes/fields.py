from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any
from app.models.dynamic_fields import DynamicFieldsCreate, DynamicFieldsResponse
from app.models.user import UserInDB, RoleEnum
from app.dependencies import get_current_active_user, require_role
from app.database import get_database

router = APIRouter(prefix="/api/fields", tags=["Dynamic Fields"])

@router.post("/", response_model=DynamicFieldsResponse, status_code=status.HTTP_201_CREATED)
async def create_dynamic_fields(
    fields_in: DynamicFieldsCreate,
    current_user: UserInDB = Depends(require_role([RoleEnum.admin]))
) -> Any:
    db = get_database()
    
    # Check if layout for department already exists
    existing_layout = await db.dynamic_fields.find_one({"department": fields_in.department})
    if existing_layout:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dynamic fields layout for department '{fields_in.department}' already exists."
        )
    
    layout_dict = fields_in.model_dump()
    result = await db.dynamic_fields.insert_one(layout_dict)
    
    created_doc = await db.dynamic_fields.find_one({"_id": result.inserted_id})
    created_doc["_id"] = str(created_doc["_id"])
    return DynamicFieldsResponse(**created_doc)


@router.get("/{department}", response_model=DynamicFieldsResponse)
async def get_dynamic_fields(
    department: str,
    current_user: UserInDB = Depends(get_current_active_user)
) -> Any:
    db = get_database()
    
    layout_doc = await db.dynamic_fields.find_one({"department": department})
    if not layout_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dynamic fields layout for department '{department}' not found."
        )
        
    layout_doc["_id"] = str(layout_doc["_id"])
    return DynamicFieldsResponse(**layout_doc)
