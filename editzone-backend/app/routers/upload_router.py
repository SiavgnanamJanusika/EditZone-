import os
import uuid
import boto3

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.core.security import get_current_user
from app.core.validators import get_file_category

router = APIRouter(prefix="/api/v1/uploads", tags=["Uploads"])


def _s3_client():
    kwargs = {"region_name": settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs.update({
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        })
    return boto3.client("s3", **kwargs)


@router.post("")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    category = get_file_category(file.filename)
    if not category:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    if settings.AWS_S3_BUCKET:
        key = f"editzone/{current_user['_id']}/{unique_name}"
        try:
            await run_in_threadpool(
                _s3_client().put_object,
                Bucket=settings.AWS_S3_BUCKET,
                Key=key,
                Body=contents,
                ContentType=file.content_type or "application/octet-stream",
            )
        except Exception as exc:
            raise HTTPException(status_code=502, detail="AWS S3 upload failed") from exc
        base_url = settings.AWS_S3_PUBLIC_BASE_URL.rstrip("/") or (
            f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com"
        )
        file_url = f"{base_url}/{key}"
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
        "original_name": file.filename,
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
