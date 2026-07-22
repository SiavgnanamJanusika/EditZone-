import socketio
from bson import ObjectId
from app.config import settings
from app.core.security import decode_token
from app.db.mongodb import messages_col, requests_col, users_col
from app.core.utils import serialize_doc, now_utc

# Async Socket.IO server, mounted onto the FastAPI ASGI app in main.py
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*" if settings.ENV == "development" else settings.CORS_ORIGINS,
)


@sio.event
async def connect(sid, environ, auth):
    """Client must send { token: <JWT access token> } as auth payload."""
    token = (auth or {}).get("token")
    if not token:
        raise ConnectionRefusedError("Authentication token required")
    try:
        payload = decode_token(token)
    except Exception:
        raise ConnectionRefusedError("Invalid or expired token")

    user_id = payload.get("sub")
    if payload.get("type") != "access" or not user_id or not ObjectId.is_valid(user_id):
        raise ConnectionRefusedError("Invalid token payload")

    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("is_banned"):
        raise ConnectionRefusedError("Account is unavailable")

    # Join a personal room for direct notifications
    await sio.save_session(sid, {"user_id": user_id})
    await sio.enter_room(sid, user_id)
    return True


@sio.event
async def disconnect(sid):
    pass


async def _can_access_request(sid, request_id):
    if not request_id or not ObjectId.is_valid(request_id):
        return False
    session = await sio.get_session(sid)
    user_id = ObjectId(session["user_id"])
    request = await requests_col.find_one({"_id": ObjectId(request_id)})
    if not request:
        return False
    return user_id in (request.get("user_id"), request.get("editor_user_id"))


@sio.event
async def join_chat(sid, data):
    """Join a specific project's chat room: data = { request_id }"""
    request_id = data.get("request_id")
    if await _can_access_request(sid, request_id):
        await sio.enter_room(sid, f"chat_{request_id}")
        return {"success": True}
    return {"success": False, "message": "Not authorized to join this chat"}


@sio.event
async def send_message(sid, data):
    """
    data = { request_id, text?, file_url?, file_type? }
    Persists message and broadcasts it to everyone in the chat room.
    """
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    request_id = data.get("request_id")
    if not await _can_access_request(sid, request_id):
        return {"success": False, "message": "Not authorized to send to this chat"}

    text = (data.get("text") or "").strip()
    file_url = data.get("file_url")
    if not text and not file_url:
        return {"success": False, "message": "Message cannot be empty"}
    if len(text) > 5000:
        return {"success": False, "message": "Message is too long"}

    doc = {
        "request_id": request_id,
        "sender_id": user_id,
        "text": text or None,
        "file_url": file_url,
        "file_type": data.get("file_type"),
        "created_at": now_utc(),
    }
    result = await messages_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    await sio.emit("new_message", serialize_doc(doc), room=f"chat_{request_id}")
    return {"success": True}


@sio.event
async def typing(sid, data):
    session = await sio.get_session(sid)
    request_id = data.get("request_id")
    if await _can_access_request(sid, request_id):
        await sio.emit(
            "user_typing",
            {"user_id": session["user_id"]},
            room=f"chat_{request_id}",
            skip_sid=sid,
        )
