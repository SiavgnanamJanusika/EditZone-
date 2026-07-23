from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional
import re
from urllib.parse import urlparse

from app.db.mongodb import editors_col, users_col
from app.schemas.schemas import EditorProfileUpdate
from app.core.security import get_current_user, require_editor
from app.core.validators import get_file_category, is_valid_upload_url
from app.core.utils import serialize_doc, serialize_list, oid

router = APIRouter(prefix="/api/v1/editors", tags=["Editors"])


async def _attach_user_info(editor_doc: dict) -> dict:
    user = await users_col.find_one({"_id": editor_doc["user_id"]})
    out = serialize_doc(editor_doc)
    if user:
        out["username"] = user.get("username")
        out["email"] = user.get("email")
    return out


@router.get("")
async def list_editors(
    category: Optional[str] = Query(None, description="All, Image Editor, TikTok Editor, Video Editor"),
    search: Optional[str] = Query(None),
    min_rate: Optional[float] = None,
    max_rate: Optional[float] = None,
):
    query = {}
    if category and category.lower() != "all":
        query["category"] = category
    if search:
        safe_search = re.escape(search.strip())
        query["$or"] = [
            {"bio": {"$regex": safe_search, "$options": "i"}},
            {"skills": {"$regex": safe_search, "$options": "i"}},
            {"location": {"$regex": safe_search, "$options": "i"}},
        ]
    if min_rate is not None or max_rate is not None:
        rate_filter = {}
        if min_rate is not None:
            rate_filter["$gte"] = min_rate
        if max_rate is not None:
            rate_filter["$lte"] = max_rate
        query["hourly_rate"] = rate_filter

    if search:
        matching_users = await users_col.find(
            {"role": "editor", "username": {"$regex": safe_search, "$options": "i"}},
            {"_id": 1},
        ).to_list(200)
        matching_user_ids = [user["_id"] for user in matching_users]
        if matching_user_ids:
            profile_filters = query.pop("$or")
            query["$or"] = profile_filters + [{"user_id": {"$in": matching_user_ids}}]

    editors = await editors_col.find(query).to_list(200)

    results = [await _attach_user_info(e) for e in editors]
    return {"editors": results, "count": len(results)}


@router.get("/{editor_id}")
async def get_editor_profile(editor_id: str):
    editor = await editors_col.find_one({"_id": oid(editor_id)})
    if not editor:
        raise HTTPException(status_code=404, detail="Editor not found")
    await editors_col.update_one({"_id": editor["_id"]}, {"$inc": {"total_views": 1}})
    return await _attach_user_info(editor)


@router.get("/me/profile")
async def get_my_editor_profile(current_user: dict = Depends(require_editor)):
    editor = await editors_col.find_one({"user_id": current_user["_id"]})
    if not editor:
        raise HTTPException(status_code=404, detail="Editor profile not found")
    return await _attach_user_info(editor)


@router.put("/me/profile")
async def update_my_editor_profile(body: EditorProfileUpdate, current_user: dict = Depends(require_editor)):
    submitted_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not submitted_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    editor = await editors_col.find_one({"user_id": current_user["_id"]})
    if not editor:
        raise HTTPException(status_code=404, detail="Editor profile not found")

    username = submitted_data.pop("username", None)
    if submitted_data:
        await editors_col.update_one({"_id": editor["_id"]}, {"$set": submitted_data})
    if username is not None:
        await users_col.update_one({"_id": current_user["_id"]}, {"$set": {"username": username}})

    editor = await editors_col.find_one({"user_id": current_user["_id"]})
    return await _attach_user_info(editor)


@router.put("/me/profile-picture")
async def update_profile_picture(file_url: str, current_user: dict = Depends(require_editor)):
    if not is_valid_upload_url(file_url) or get_file_category(urlparse(file_url).path) != "image":
        raise HTTPException(status_code=400, detail="Profile picture must be a valid uploaded image")
    await editors_col.update_one({"user_id": current_user["_id"]}, {"$set": {"profile_picture": file_url}})
    return {"message": "Profile picture updated", "profile_picture": file_url}


@router.post("/me/portfolio")
async def add_portfolio_item(file_url: str, current_user: dict = Depends(require_editor)):
    if not is_valid_upload_url(file_url):
        raise HTTPException(status_code=400, detail="Portfolio item must be a valid uploaded file")
    profile = await editors_col.find_one({"user_id": current_user["_id"]}, {"portfolio_links": 1})
    if not profile:
        raise HTTPException(status_code=404, detail="Editor profile not found")
    if len(profile.get("portfolio_links", [])) >= 50:
        raise HTTPException(status_code=400, detail="Portfolio is limited to 50 items")
    await editors_col.update_one(
        {"user_id": current_user["_id"]}, {"$push": {"portfolio_links": file_url}}
    )
    return {"message": "Portfolio item added"}
