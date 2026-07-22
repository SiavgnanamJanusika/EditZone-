from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "EditZone API"
    ENV: str = "development"

    # Mongo
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "editzone"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_SUPER_SECRET_KEY_EDITZONE_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # File uploads (local fallback; swap for Cloudinary/S3 in production)
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_MB: int = 100

    # AWS S3 storage. Local storage is used only in development when no bucket is set.
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_PUBLIC_BASE_URL: str = ""

    # Google OAuth (optional)
    GOOGLE_CLIENT_ID: str = ""

    # Email (optional - for verification/OTP; console fallback if unset)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@editzone.com"

    # Platform economics
    PLATFORM_COMMISSION_PERCENT: float = 15.0
    CLIENT_MONTHLY_ADMIN_FEE: float = 500.0
    PLATFORM_CURRENCY: str = "LKR"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
