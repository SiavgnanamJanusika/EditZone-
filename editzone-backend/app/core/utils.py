from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException


def oid(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    return ObjectId(id_str)


def serialize_doc(doc: dict) -> dict:
    """Convert a Mongo document into a JSON-safe dict."""
    if doc is None:
        return None
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    for key, value in out.items():
        if isinstance(value, ObjectId):
            out[key] = str(value)
        if isinstance(value, datetime):
            out[key] = value.isoformat()
    return out


def serialize_list(docs) -> list:
    return [serialize_doc(d) for d in docs]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
