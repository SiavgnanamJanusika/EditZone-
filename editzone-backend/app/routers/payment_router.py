import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.db.mongodb import payments_col, requests_col, users_col
from app.schemas.schemas import CreatePaymentBody
from app.core.security import require_user, get_current_user
from app.core.utils import serialize_doc, serialize_list, oid, now_utc
from app.config import settings

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


def _mock_gateway_charge(method: str, card_number: str, amount: float) -> dict:
    """
    Simulates a Stripe/PayHere charge. Swap this out for real SDK calls:
      - stripe.PaymentIntent.create(...)   [services/stripe_service.py]
      - PayHere hash-based checkout        [services/payhere_service.py]
    Any card ending in 0000 is treated as a declined test card.
    """
    if card_number.endswith("0000"):
        return {"success": False, "reason": "Card declined by issuer"}
    return {"success": True, "transaction_id": f"{method}_{uuid.uuid4().hex[:16]}"}


@router.post("")
async def create_payment(body: CreatePaymentBody, current_user: dict = Depends(require_user)):
    req_doc = await requests_col.find_one({"_id": oid(body.request_id)})
    if not req_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if req_doc["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your project request")
    if req_doc["status"] not in ("accepted", "in_progress"):
        raise HTTPException(status_code=400, detail="Project must be accepted before payment")

    existing_payment = await payments_col.find_one({"request_id": body.request_id, "status": {"$ne": "failed"}})
    if existing_payment:
        raise HTTPException(status_code=409, detail="Payment already made for this request")

    billing_period = now_utc().strftime("%Y-%m")
    monthly_fee_due = not await payments_col.find_one({
        "user_id": current_user["_id"],
        "billing_period": billing_period,
        "payment_type": "monthly_admin_fee",
        "status": "success",
    })
    monthly_fee = settings.CLIENT_MONTHLY_ADMIN_FEE if monthly_fee_due else 0.0
    charged_total = round(body.amount + monthly_fee, 2)
    charge = _mock_gateway_charge(body.payment_method, body.card_number, charged_total)

    commission = round(body.amount * settings.PLATFORM_COMMISSION_PERCENT / 100, 2)
    editor_payout = round(body.amount - commission, 2)

    doc = {
        "request_id": body.request_id,
        "payment_type": "project_payment",
        "user_id": current_user["_id"],
        "editor_user_id": req_doc["editor_user_id"],
        "project_name": body.project_name,
        "project_description": body.project_description,
        "editor_name": body.editor_name,
        "delivery_date": body.delivery_date,
        "order_date": body.order_date,
        "payment_method": body.payment_method,
        "amount": body.amount,
        "currency": settings.PLATFORM_CURRENCY,
        "charged_total": charged_total,
        "monthly_admin_fee": monthly_fee,
        "commission_percent": settings.PLATFORM_COMMISSION_PERCENT,
        "commission_amount": commission,
        "editor_payout_amount": editor_payout,
        "card_last4": body.card_number[-4:],
        "card_holder_name": body.card_holder_name,
        "status": "success" if charge["success"] else "failed",
        "escrow_status": "held" if charge["success"] else "n/a",
        "transaction_id": charge.get("transaction_id"),
        "failure_reason": charge.get("reason"),
        "created_at": now_utc(),
    }
    result = await payments_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    if not charge["success"]:
        raise HTTPException(status_code=402, detail=charge["reason"])

    if monthly_fee_due:
        admin = await users_col.find_one({"role": "admin", "is_banned": {"$ne": True}})
        await payments_col.insert_one({
            "request_id": None,
            "payment_type": "monthly_admin_fee",
            "billing_period": billing_period,
            "user_id": current_user["_id"],
            "project_name": f"Monthly Admin Fee — {billing_period}",
            "payment_method": body.payment_method,
            "amount": monthly_fee,
            "currency": settings.PLATFORM_CURRENCY,
            "commission_amount": monthly_fee,
            "editor_payout_amount": 0.0,
            "status": "success",
            "escrow_status": "held",
            "beneficiary_role": "admin",
            "beneficiary_user_id": admin.get("_id") if admin else None,
            "transaction_id": charge.get("transaction_id"),
            "created_at": now_utc(),
        })

    await requests_col.update_one({"_id": req_doc["_id"]}, {"$set": {"status": "in_progress", "paid": True}})
    return serialize_doc(doc)


@router.get("/mine")
async def my_payments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "editor":
        docs = await payments_col.find({"editor_user_id": current_user["_id"]}).sort("created_at", -1).to_list(200)
    else:
        docs = await payments_col.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(200)
    return {"payments": serialize_list(docs)}


@router.get("/monthly-fee/status")
async def monthly_fee_status(current_user: dict = Depends(require_user)):
    billing_period = now_utc().strftime("%Y-%m")
    paid = await payments_col.find_one({
        "user_id": current_user["_id"],
        "billing_period": billing_period,
        "payment_type": "monthly_admin_fee",
        "status": "success",
    })
    return {
        "billing_period": billing_period,
        "amount": settings.CLIENT_MONTHLY_ADMIN_FEE,
        "currency": settings.PLATFORM_CURRENCY,
        "due": paid is None,
        "escrow_status": paid.get("escrow_status") if paid else None,
    }


@router.get("/{request_id}")
async def get_payment_for_request(request_id: str, current_user: dict = Depends(get_current_user)):
    doc = await payments_col.find_one({"request_id": request_id})
    if not doc:
        raise HTTPException(status_code=404, detail="No payment found for this request")
    if current_user["role"] != "admin" and current_user["_id"] not in (
        doc.get("user_id"), doc.get("editor_user_id")
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this payment")
    return serialize_doc(doc)
