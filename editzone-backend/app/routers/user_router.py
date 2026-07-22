from fastapi import APIRouter, Depends, HTTPException

from app.db.mongodb import users_col
from app.core.security import get_current_user
from app.core.utils import serialize_doc
from app.schemas.schemas import UserProfileUpdate

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return serialize_doc(current_user)


@router.put("/me")
async def update_my_profile(body: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {key: value for key, value in body.model_dump().items() if value is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await users_col.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    updated = await users_col.find_one({"_id": current_user["_id"]})
    return serialize_doc(updated)
