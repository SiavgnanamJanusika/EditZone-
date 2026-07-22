import re
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Optional, List, Literal


# ---------- Editor Profile ----------
class ValidatedModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


class EditorProfileUpdate(ValidatedModel):
    bio: Optional[str] = Field(default=None, max_length=1000)
    skills: Optional[List[str]] = Field(default=None, max_length=20)
    hourly_rate: Optional[float] = Field(default=None, ge=0, le=1_000_000)
    location: Optional[str] = Field(default=None, max_length=100)
    category: Optional[Literal["Image Editor", "TikTok Editor", "Video Editor"]] = None

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, value):
        if value is None:
            return value
        cleaned = list(dict.fromkeys(skill.strip() for skill in value if skill.strip()))
        if any(len(skill) > 50 for skill in cleaned):
            raise ValueError("Each skill must be 50 characters or fewer")
        return cleaned


# ---------- Requests ----------
class CreateRequestBody(ValidatedModel):
    editor_id: str
    project_title: str = Field(min_length=3, max_length=120)
    project_description: str = Field(min_length=20, max_length=5000)


class RequestActionBody(ValidatedModel):
    action: Literal["accept", "reject"]


# ---------- Chat ----------
class SendMessageBody(ValidatedModel):
    request_id: str
    text: Optional[str] = Field(default=None, max_length=5000)
    file_url: Optional[str] = Field(default=None, max_length=2048)
    file_type: Optional[Literal["image", "video", "document", "archive", "audio"]] = None


class UserProfileUpdate(ValidatedModel):
    district: Optional[Literal[
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara",
        "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa",
        "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
        "Badulla", "Monaragala", "Ratnapura", "Kegalle",
    ]] = None
    phone: Optional[str] = Field(default=None, pattern=r"^(?:\+94|0)[0-9]{9}$")


# ---------- Payments ----------
class CreatePaymentBody(ValidatedModel):
    request_id: str
    project_name: str = Field(min_length=3, max_length=120)
    project_description: str = Field(min_length=20, max_length=5000)
    editor_name: str = Field(min_length=2, max_length=50)
    delivery_date: str
    order_date: str
    payment_method: Literal["visa", "mastercard", "payhere", "stripe"]
    amount: float = Field(gt=0, le=10_000_000)
    card_number: str
    card_holder_name: str = Field(min_length=2, max_length=100, pattern=r"^[A-Za-z][A-Za-z .'-]*$")
    expiry_date: str
    cvv: str

    @field_validator("card_number")
    @classmethod
    def validate_card(cls, v):
        digits = v.replace(" ", "")
        if not digits.isdigit() or not (13 <= len(digits) <= 19):
            raise ValueError("Invalid card number")
        checksum = sum((digit * 2 - 9 if digit * 2 > 9 else digit * 2) if index % 2 == len(digits) % 2 else digit for index, digit in enumerate(map(int, digits)))
        if checksum % 10:
            raise ValueError("Invalid card number")
        return digits

    @field_validator("cvv")
    @classmethod
    def validate_cvv(cls, v):
        if not v.isdigit() or not (3 <= len(v) <= 4):
            raise ValueError("Invalid CVV")
        return v

    @field_validator("order_date", "delivery_date")
    @classmethod
    def validate_date(cls, value):
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("Date must use YYYY-MM-DD format") from exc
        return value

    @field_validator("expiry_date")
    @classmethod
    def validate_expiry(cls, value):
        if not re.fullmatch(r"(0[1-9]|1[0-2])/\d{2}", value):
            raise ValueError("Expiry date must use MM/YY format")
        month, year = map(int, value.split("/"))
        today = datetime.now()
        if (2000 + year, month) < (today.year, today.month):
            raise ValueError("Card has expired")
        return value

    @model_validator(mode="after")
    def validate_schedule(self):
        if date.fromisoformat(self.delivery_date) < date.fromisoformat(self.order_date):
            raise ValueError("Delivery date cannot be before order date")
        return self


# ---------- Reviews ----------
class CreateReviewBody(ValidatedModel):
    request_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(max_length=2000)

    @field_validator("comment")
    @classmethod
    def validate_comment_len(cls, v):
        if len(v.strip()) < 100:
            raise ValueError("Review must be at least 100 characters")
        return v


# ---------- Admin ----------
class BanUserBody(ValidatedModel):
    is_banned: bool


class ApproveDeliveryBody(ValidatedModel):
    approve: bool
    admin_note: Optional[str] = Field(default=None, max_length=1000)
