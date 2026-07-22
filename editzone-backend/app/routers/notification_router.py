from fastapi import APIRouter, Depends

from app.db.mongodb import notifications_col
from app.core.security import get_current_user
from app.core.utils import serialize_list, oid

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    docs = await notifications_col.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    return {"notifications": serialize_list(docs)}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await notifications_col.update_one(
        {"_id": oid(notification_id), "user_id": current_user["_id"]},
        {"$set": {"is_read": True}},
    )
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await notifications_col.update_many(
        {"user_id": current_user["_id"], "is_read": False}, {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}
