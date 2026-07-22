from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal


# ---------- Editor Profile ----------
class EditorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    location: Optional[str] = None
    portfolio_links: Optional[List[str]] = None
    category: Optional[Literal["Image Editor", "TikTok Editor", "Video Editor"]] = None


# ---------- Requests ----------
class CreateRequestBody(BaseModel):
    editor_id: str
    project_title: str
    project_description: str


class RequestActionBody(BaseModel):
    action: Literal["accept", "reject"]


# ---------- Chat ----------
class SendMessageBody(BaseModel):
    request_id: str
    text: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None  # image/video/document/archive/audio


# ---------- Payments ----------
class CreatePaymentBody(BaseModel):
    request_id: str
    project_name: str
    project_description: str
    editor_name: str
    delivery_date: str
    order_date: str
    payment_method: Literal["visa", "mastercard", "payhere", "stripe"]
    amount: float
    card_number: str
    card_holder_name: str
    expiry_date: str
    cvv: str

    @field_validator("card_number")
    @classmethod
    def validate_card(cls, v):
        digits = v.replace(" ", "")
        if not digits.isdigit() or not (13 <= len(digits) <= 19):
            raise ValueError("Invalid card number")
        return digits

    @field_validator("cvv")
    @classmethod
    def validate_cvv(cls, v):
        if not v.isdigit() or not (3 <= len(v) <= 4):
            raise ValueError("Invalid CVV")
        return v


# ---------- Reviews ----------
class CreateReviewBody(BaseModel):
    request_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

    @field_validator("comment")
    @classmethod
    def validate_comment_len(cls, v):
        if len(v.strip()) < 100:
            raise ValueError("Review must be at least 100 characters")
        return v


# ---------- Admin ----------
class BanUserBody(BaseModel):
    is_banned: bool


class ApproveDeliveryBody(BaseModel):
    approve: bool
    admin_note: Optional[str] = None
