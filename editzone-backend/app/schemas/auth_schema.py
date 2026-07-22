from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from app.core.validators import is_valid_nic, is_valid_phone


class ChooseRoleRequest(BaseModel):
    role: Literal["user", "editor"]


class RegisterAccountRequest(BaseModel):
    """Step 1: create the login credentials (post choose-role)."""
    username: str
    email: EmailStr
    password: str
    nic: str
    role: Literal["user", "editor"]

    @field_validator("nic")
    @classmethod
    def validate_nic(cls, v):
        if not is_valid_nic(v):
            raise ValueError("Invalid Sri Lankan NIC number")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    nic: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    id_token: str
    role: Optional[Literal["user", "editor"]] = None


class CompleteProfileRequest(BaseModel):
    """Step 2: complete registration details after first login."""
    username: str
    nic: str
    district: str
    gender: Literal["Male", "Female"]
    phone: str

    @field_validator("nic")
    @classmethod
    def validate_nic(cls, v):
        if not is_valid_nic(v):
            raise ValueError("Invalid Sri Lankan NIC number")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if not is_valid_phone(v):
            raise ValueError("Invalid Sri Lankan phone number")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    registration_complete: bool
    user_id: str
