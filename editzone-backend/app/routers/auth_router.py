import random
import re
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.db.mongodb import users_col, editors_col, otps_col
from app.schemas.auth_schema import (
    RegisterAccountRequest, LoginRequest, CompleteProfileRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyOtpRequest,
    TokenResponse, GoogleLoginRequest,
)
from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    get_current_user,
)
from app.core.utils import serialize_doc, now_utc
from app.core.validators import is_valid_nic

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def _generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


async def _issue_tokens(user: dict) -> TokenResponse:
    uid = str(user["_id"])
    access = create_access_token({"sub": uid, "role": user["role"]})
    refresh = create_refresh_token({"sub": uid})
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=user["role"],
        registration_complete=user.get("registration_complete", False),
        user_id=uid,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterAccountRequest):
    email = str(body.email).strip().lower()
    nic = body.nic.strip().upper()
    existing = await users_col.find_one({
        "$or": [
            {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}},
            {"nic": {"$regex": f"^{re.escape(nic)}$", "$options": "i"}},
        ]
    })
    if existing:
        raise HTTPException(status_code=409, detail="Email or NIC already registered")

    user_doc = {
        "username": body.username,
        "email": email,
        "password_hash": hash_password(body.password),
        "nic": nic,
        "role": body.role,
        "registration_complete": False,
        "is_email_verified": False,
        "is_banned": False,
        "created_at": now_utc(),
    }
    result = await users_col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    if body.role == "editor":
        await editors_col.insert_one({
            "user_id": result.inserted_id,
            "bio": "",
            "skills": [],
            "hourly_rate": 0,
            "location": "",
            "portfolio_links": [],
            "profile_picture": "",
            "category": "Video Editor",
            "rating_avg": 0,
            "rating_count": 0,
            "total_views": 0,
            "created_at": now_utc(),
        })

    return await _issue_tokens(user_doc)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    email = str(body.email).strip().lower()
    nic = body.nic.strip().upper() if body.nic else None
    user = await users_col.find_one({
        "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
    })
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if nic and user.get("nic") and nic != user.get("nic", "").strip().upper():
        raise HTTPException(status_code=401, detail="NIC does not match our records")
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="Account has been suspended")
    return await _issue_tokens(user)


@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest):
    """
    Verifies a Google ID token and logs in / auto-registers the user.
    NOTE: to fully enable, set GOOGLE_CLIENT_ID in .env and wire google-auth's
    id_token.verify_oauth2_token here. Left as an extension point.
    """
    raise HTTPException(
        status_code=501,
        detail="Google login requires GOOGLE_CLIENT_ID to be configured on the server.",
    )


@router.post("/complete-profile", response_model=dict)
async def complete_profile(body: CompleteProfileRequest, current_user: dict = Depends(get_current_user)):
    if body.nic != current_user.get("nic"):
        existing = await users_col.find_one({"nic": body.nic, "_id": {"$ne": current_user["_id"]}})
        if existing:
            raise HTTPException(status_code=409, detail="NIC already in use")

    await users_col.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "username": body.username,
            "nic": body.nic,
            "district": body.district,
            "gender": body.gender,
            "phone": body.phone,
            "registration_complete": True,
            "updated_at": now_utc(),
        }},
    )
    redirect_to = "editors" if current_user["role"] == "user" else "editor-dashboard"
    return {"message": "Profile completed successfully", "redirect_to": redirect_to}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_doc(current_user)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await users_col.find_one({"email": body.email})
    if not user:
        # Don't leak whether the email exists
        return {"message": "If that email exists, an OTP has been sent."}

    otp = _generate_otp()
    await otps_col.update_one(
        {"email": body.email},
        {"$set": {"email": body.email, "otp": otp, "created_at": now_utc(), "purpose": "reset_password"}},
        upsert=True,
    )
    # In production this sends via SMTP (see services/email_service.py). Logged here for dev.
    print(f"[DEV EMAIL] Password reset OTP for {body.email}: {otp}")
    return {"message": "If that email exists, an OTP has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    record = await otps_col.find_one({"email": body.email, "purpose": "reset_password"})
    if not record or record["otp"] != body.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    if (now_utc() - record["created_at"].replace(tzinfo=now_utc().tzinfo)) > timedelta(minutes=15):
        raise HTTPException(status_code=400, detail="OTP has expired")

    await users_col.update_one(
        {"email": body.email},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    await otps_col.delete_one({"_id": record["_id"]})
    return {"message": "Password reset successfully"}


@router.post("/send-otp")
async def send_email_otp(body: ForgotPasswordRequest):
    otp = _generate_otp()
    await otps_col.update_one(
        {"email": body.email},
        {"$set": {"email": body.email, "otp": otp, "created_at": now_utc(), "purpose": "verify_email"}},
        upsert=True,
    )
    print(f"[DEV EMAIL] Email verification OTP for {body.email}: {otp}")
    return {"message": "OTP sent to your email"}


@router.post("/verify-otp")
async def verify_email_otp(body: VerifyOtpRequest):
    record = await otps_col.find_one({"email": body.email, "purpose": "verify_email"})
    if not record or record["otp"] != body.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    await users_col.update_one({"email": body.email}, {"$set": {"is_email_verified": True}})
    await otps_col.delete_one({"_id": record["_id"]})
    return {"message": "Email verified successfully"}


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # Stateless JWT: client discards tokens. Extend with a token_blacklist collection
    # + Redis if server-side invalidation is required.
    return {"message": "Logged out successfully"}
