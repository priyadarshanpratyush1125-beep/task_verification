from pydantic import BaseModel, Field
from typing import List

class DynamicFieldDefinition(BaseModel):
    name: str
    type: str

class DynamicFieldsBase(BaseModel):
    department: str
    fields: List[DynamicFieldDefinition]

class DynamicFieldsCreate(DynamicFieldsBase):
    pass

class DynamicFieldsResponse(DynamicFieldsBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True
