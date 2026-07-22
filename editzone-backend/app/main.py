import socketio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.db.mongodb import ensure_indexes
from app.sockets.socket_manager import sio

from app.routers import (
    auth_router,
    user_router,
    editor_router,
    request_router,
    chat_router,
    payment_router,
    review_router,
    admin_router,
    upload_router,
    notification_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    description="EditZone — connecting clients with professional video editors.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=(
        r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?"
        if settings.ENV == "development"
        else None
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [{"field": ".".join(str(x) for x in e["loc"]), "message": e["msg"]} for e in exc.errors()]
    message = errors[0]["message"].removeprefix("Value error, ") if errors else "Validation error"
    return JSONResponse(status_code=422, content={"success": False, "message": message, "errors": errors})


@app.on_event("startup")
async def on_startup():
    await ensure_indexes()


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": settings.APP_NAME}


app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(editor_router.router)
app.include_router(request_router.router)
app.include_router(chat_router.router)
app.include_router(payment_router.router)
app.include_router(review_router.router)
app.include_router(admin_router.router)
app.include_router(upload_router.router)
app.include_router(notification_router.router)

# Mount Socket.IO onto the FastAPI ASGI app -> served at /socket.io/
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/socket.io")
