from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.db.mongodb import requests_col, editors_col, users_col, notifications_col
from app.schemas.schemas import CreateRequestBody, RequestActionBody
from app.core.security import get_current_user, require_user, require_editor
from app.core.utils import serialize_doc, serialize_list, oid, now_utc
from app.sockets.socket_manager import sio

router = APIRouter(prefix="/api/v1/requests", tags=["Requests"])


async def _notify(user_id: ObjectId, title: str, body: str, request_id: str = None):
    doc = {
        "user_id": user_id,
        "title": title,
        "body": body,
        "request_id": request_id,
        "is_read": False,
        "created_at": now_utc(),
    }
    await notifications_col.insert_one(doc)
    await sio.emit("notification", {"title": title, "body": body}, room=str(user_id))


@router.post("", status_code=201)
async def create_request(body: CreateRequestBody, current_user: dict = Depends(require_user)):
    editor = await editors_col.find_one({"_id": oid(body.editor_id)})
    if not editor:
        raise HTTPException(status_code=404, detail="Editor not found")

    doc = {
        "user_id": current_user["_id"],
        "editor_id": editor["_id"],
        "editor_user_id": editor["user_id"],
        "project_title": body.project_title,
        "project_description": body.project_description,
        "status": "pending",  # pending -> accepted/rejected -> in_progress -> delivered -> completed
        "delivered_file_url": None,
        "admin_approved": False,
        "created_at": now_utc(),
    }
    result = await requests_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    await _notify(editor["user_id"], "New Project Request",
                  f"{current_user['username']} sent you a project request: {body.project_title}",
                  str(doc["_id"]))
    return serialize_doc(doc)


@router.get("/mine")
async def my_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "editor":
        editor = await editors_col.find_one({"user_id": current_user["_id"]})
        if not editor:
            return {"requests": []}
        docs = await requests_col.find({"editor_id": editor["_id"]}).sort("created_at", -1).to_list(200)
    else:
        docs = await requests_col.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(200)
    return {"requests": serialize_list(docs)}


@router.get("/{request_id}")
async def get_request(request_id: str, current_user: dict = Depends(get_current_user)):
    doc = await requests_col.find_one({"_id": oid(request_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user["_id"] not in (doc["user_id"], doc["editor_user_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this request")
    return serialize_doc(doc)


@router.patch("/{request_id}/respond")
async def respond_to_request(request_id: str, body: RequestActionBody, current_user: dict = Depends(require_editor)):
    doc = await requests_col.find_one({"_id": oid(request_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if doc["editor_user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your request to respond to")
    if doc["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already responded to")

    new_status = "accepted" if body.action == "accept" else "rejected"
    await requests_col.update_one({"_id": doc["_id"]}, {"$set": {"status": new_status, "responded_at": now_utc()}})

    if new_status == "accepted":
        await _notify(doc["user_id"], "Request Accepted",
                      f"Your project '{doc['project_title']}' was accepted! You can now start chatting.",
                      str(doc["_id"]))
    else:
        await _notify(doc["user_id"], "Request Rejected",
                      f"Your project '{doc['project_title']}' was rejected. Check out similar editors.",
                      str(doc["_id"]))

    updated = await requests_col.find_one({"_id": doc["_id"]})
    return serialize_doc(updated)


@router.post("/{request_id}/deliver")
async def deliver_video(request_id: str, file_url: str, current_user: dict = Depends(require_editor)):
    """Editor uploads finished video; goes to admin for verification before release."""
    doc = await requests_col.find_one({"_id": oid(request_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if doc["editor_user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your request")
    if doc["status"] not in ("accepted", "in_progress"):
        raise HTTPException(status_code=400, detail="Request not in a deliverable state")

    await requests_col.update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "delivered", "delivered_file_url": file_url, "delivered_at": now_utc(), "admin_approved": False}},
    )
    return {"message": "Video submitted. Awaiting admin verification before release to client."}
