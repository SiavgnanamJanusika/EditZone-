from fastapi import APIRouter, Depends, HTTPException

from app.db.mongodb import users_col, editors_col, requests_col, payments_col
from app.schemas.schemas import BanUserBody, ApproveDeliveryBody
from app.core.security import require_admin
from app.core.utils import serialize_list, serialize_doc, oid, now_utc
from app.sockets.socket_manager import sio

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/users")
async def list_users(current_user: dict = Depends(require_admin)):
    docs = await users_col.find({"role": "user"}).to_list(500)
    return {"users": serialize_list(docs)}


@router.get("/editors")
async def list_all_editors(current_user: dict = Depends(require_admin)):
    docs = await editors_col.find({}).to_list(500)
    user_ids = [doc.get("user_id") for doc in docs if doc.get("user_id")]
    users = await users_col.find({"_id": {"$in": user_ids}}, {"username": 1, "email": 1, "is_banned": 1}).to_list(500)
    users_by_id = {user["_id"]: user for user in users}
    results = []
    for doc in docs:
        item = serialize_doc(doc)
        user = users_by_id.get(doc.get("user_id"), {})
        item.update({
            "username": user.get("username", "Unknown editor"),
            "email": user.get("email", ""),
            "is_banned": user.get("is_banned", False),
        })
        results.append(item)
    return {"editors": results}


@router.patch("/users/{user_id}/ban")
async def ban_user(user_id: str, body: BanUserBody, current_user: dict = Depends(require_admin)):
    result = await users_col.update_one({"_id": oid(user_id)}, {"$set": {"is_banned": body.is_banned}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User ban status updated", "is_banned": body.is_banned}


@router.get("/payments")
async def list_all_payments(current_user: dict = Depends(require_admin)):
    docs = await payments_col.find({}).sort("created_at", -1).to_list(500)
    return {"payments": serialize_list(docs)}


@router.patch("/payments/{payment_id}/release")
async def release_admin_fee(payment_id: str, current_user: dict = Depends(require_admin)):
    payment = await payments_col.find_one({"_id": oid(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.get("payment_type") != "monthly_admin_fee":
        raise HTTPException(status_code=400, detail="Only monthly admin fee escrow can be released here")
    if payment.get("escrow_status") != "held":
        raise HTTPException(status_code=409, detail="Escrow has already been released")
    await payments_col.update_one(
        {"_id": payment["_id"], "escrow_status": "held"},
        {"$set": {
            "escrow_status": "released",
            "released_at": now_utc(),
            "released_by": current_user["_id"],
        }},
    )
    return {"message": "Monthly admin fee escrow released"}


@router.get("/projects")
async def monitor_projects(current_user: dict = Depends(require_admin)):
    docs = await requests_col.find({}).sort("created_at", -1).to_list(500)
    user_ids = list({uid for doc in docs for uid in (doc.get("user_id"), doc.get("editor_user_id")) if uid})
    users = await users_col.find({"_id": {"$in": user_ids}}, {"username": 1, "email": 1}).to_list(1000)
    users_by_id = {user["_id"]: user for user in users}
    results = []
    for doc in docs:
        item = serialize_doc(doc)
        client = users_by_id.get(doc.get("user_id"), {})
        editor = users_by_id.get(doc.get("editor_user_id"), {})
        item.update({
            "client_name": client.get("username", "Unknown client"),
            "client_email": client.get("email", ""),
            "editor_name": editor.get("username", "Unknown editor"),
            "editor_email": editor.get("email", ""),
        })
        results.append(item)
    return {"projects": results}


@router.get("/projects/pending-verification")
async def pending_verification(current_user: dict = Depends(require_admin)):
    """Videos uploaded by editors, awaiting admin approval before release + delivery."""
    docs = await requests_col.find({"status": "delivered", "admin_approved": False}).to_list(200)
    return {"projects": serialize_list(docs)}


@router.patch("/projects/{request_id}/verify-delivery")
async def verify_delivery(request_id: str, body: ApproveDeliveryBody, current_user: dict = Depends(require_admin)):
    req_doc = await requests_col.find_one({"_id": oid(request_id)})
    if not req_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if req_doc["status"] != "delivered":
        raise HTTPException(status_code=400, detail="Project is not awaiting delivery verification")

    if not body.approve:
        await requests_col.update_one(
            {"_id": req_doc["_id"]},
            {"$set": {"status": "in_progress", "admin_note": body.admin_note}},
        )
        return {"message": "Delivery rejected, sent back to editor for revision"}

    # Approve: release escrow (85% to editor), mark completed, deliver video to user
    payment = await payments_col.find_one({"request_id": request_id, "status": "success"})
    if payment:
        await payments_col.update_one(
            {"_id": payment["_id"]},
            {"$set": {"escrow_status": "released", "released_at": now_utc()}},
        )

    await requests_col.update_one(
        {"_id": req_doc["_id"]},
        {"$set": {"status": "completed", "admin_approved": True, "completed_at": now_utc()}},
    )

    await sio.emit(
        "notification",
        {"title": "Project Delivered!", "body": f"Your video for '{req_doc['project_title']}' is ready."},
        room=str(req_doc["user_id"]),
    )
    return {"message": "Delivery approved. Escrow released to editor, video delivered to client."}


@router.get("/dashboard-stats")
async def dashboard_stats(current_user: dict = Depends(require_admin)):
    total_users = await users_col.count_documents({"role": "user"})
    total_editors = await users_col.count_documents({"role": "editor"})
    total_projects = await requests_col.count_documents({})
    completed_projects = await requests_col.count_documents({"status": "completed"})
    pending_verification_count = await requests_col.count_documents({"status": "delivered", "admin_approved": False})

    payments = await payments_col.find({"status": "success"}).to_list(2000)
    total_revenue = sum(p["amount"] for p in payments)
    total_commission = sum(p["commission_amount"] for p in payments)

    return {
        "total_users": total_users,
        "total_editors": total_editors,
        "total_projects": total_projects,
        "completed_projects": completed_projects,
        "pending_verification": pending_verification_count,
        "total_revenue": round(total_revenue, 2),
        "total_platform_commission": round(total_commission, 2),
    }
