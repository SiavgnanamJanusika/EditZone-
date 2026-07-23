import os
import uuid
import boto3
from botocore.exceptions import BotoCoreError, ClientError

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import RedirectResponse
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.core.security import get_current_user
from app.core.validators import get_file_category

router = APIRouter(prefix="/api/v1/uploads", tags=["Uploads"])

ALLOWED_MIME_PREFIXES = {
    "image": ("image/",),
    "video": ("video/",),
    "document": ("application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument", "text/plain"),
    "archive": ("application/zip", "application/x-rar", "application/vnd.rar", "application/x-7z-compressed"),
    "audio": ("audio/",),
}


def _s3_client():
    kwargs = {"region_name": settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs.update({
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        })
    return boto3.client("s3", **kwargs)


def _s3_error_message(exc: Exception) -> str:
    if isinstance(exc, ClientError):
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("InvalidAccessKeyId", "SignatureDoesNotMatch", "AccessDenied"):
            return "AWS S3 credentials do not have access to the configured bucket"
        if code in ("NoSuchBucket", "PermanentRedirect"):
            return "AWS S3 bucket or region is configured incorrectly"
    if isinstance(exc, BotoCoreError):
        return "AWS credentials are unavailable or AWS S3 could not be reached"
    return "AWS S3 operation failed"


@router.post("")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    filename = file.filename or ""
    category = get_file_category(filename)
    if not category:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    content_type = (file.content_type or "").lower()
    if content_type and not any(content_type.startswith(prefix) for prefix in ALLOWED_MIME_PREFIXES[category]):
        raise HTTPException(status_code=400, detail="File content type does not match its extension")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="File cannot be empty")
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    ext = filename.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    if settings.AWS_S3_BUCKET:
        key = f"editzone/{current_user['_id']}/{unique_name}"
        try:
            await run_in_threadpool(
                _s3_client().put_object,
                Bucket=settings.AWS_S3_BUCKET,
                Key=key,
                Body=contents,
                ContentType=content_type or "application/octet-stream",
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(status_code=502, detail=_s3_error_message(exc)) from exc
        base_url = settings.AWS_S3_PUBLIC_BASE_URL.rstrip("/")
        file_url = f"{base_url}/{key}" if base_url else f"/api/v1/uploads/s3/{key}"
        storage = "aws_s3"
    else:
        if settings.ENV != "development":
            raise HTTPException(status_code=503, detail="AWS S3 storage is not configured")
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filepath = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(filepath, "wb") as f:
            f.write(contents)
        file_url = f"/api/v1/uploads/file/{unique_name}"
        storage = "local_development"

    return {
        "file_url": file_url,
        "file_type": category,
        "original_name": filename,
        "size_mb": round(size_mb, 2),
        "storage": storage,
    }


@router.get("/file/{filename}")
async def get_uploaded_file(filename: str):
    from fastapi.responses import FileResponse
    if filename != os.path.basename(filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)


@router.get("/s3/{key:path}")
async def get_s3_file(key: str):
    if not settings.AWS_S3_BUCKET:
        raise HTTPException(status_code=404, detail="AWS S3 storage is not configured")
    if not key.startswith("editzone/") or ".." in key.split("/"):
        raise HTTPException(status_code=400, detail="Invalid S3 object key")
    try:
        url = await run_in_threadpool(
            _s3_client().generate_presigned_url,
            "get_object",
            Params={"Bucket": settings.AWS_S3_BUCKET, "Key": key},
            ExpiresIn=900,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail=_s3_error_message(exc)) from exc
    return RedirectResponse(url=url, status_code=307)
