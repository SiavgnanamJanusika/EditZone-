from fastapi import APIRouter, Depends, HTTPException

from app.db.mongodb import messages_col, requests_col
from app.core.security import get_current_user
from app.core.utils import serialize_list, oid

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


@router.get("/{request_id}/messages")
async def get_chat_history(request_id: str, current_user: dict = Depends(get_current_user)):
    req_doc = await requests_col.find_one({"_id": oid(request_id)})
    if not req_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user["_id"] not in (req_doc["user_id"], req_doc["editor_user_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    if req_doc["status"] not in ("accepted", "in_progress", "delivered", "completed"):
        raise HTTPException(status_code=400, detail="Chat is only available after the request is accepted")

    # Fetch the most recent messages efficiently, then return them oldest-first for the UI.
    msgs = await messages_col.find({"request_id": request_id}).sort("created_at", -1).to_list(1000)
    msgs.reverse()
    return {"messages": serialize_list(msgs)}
