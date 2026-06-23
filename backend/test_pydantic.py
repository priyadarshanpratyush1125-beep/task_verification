from pydantic import BaseModel, Field

class UserInDB(BaseModel):
    id: str = Field(alias="_id")

user_doc = {"_id": "676451def5bc244f0ce95cd7", "name": "emp1", "role": "employee"}
user = UserInDB(**user_doc)
print(user.id)
