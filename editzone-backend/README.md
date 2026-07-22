# EditZone — Backend

FastAPI + MongoDB (Motor) + Socket.IO backend for the EditZone video-editor marketplace.

## Tech
FastAPI · Motor (MongoDB) · JWT (python-jose) · bcrypt==4.0.1 (via passlib) · python-socketio · Cloudinary/S3-ready file uploads

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit MONGO_URI, JWT_SECRET_KEY, etc.
```

Make sure MongoDB is running locally, or point `MONGO_URI` at Atlas.

Run the dev server (note: entrypoint is `socket_app`, not `app`, because Socket.IO wraps FastAPI):

```bash
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs
Health check: http://localhost:8000/api/v1/health

Create your first admin account:

```bash
python scripts/create_admin.py
```

## Docker

```bash
docker compose up --build
```

## Folder Structure

```
app/
  main.py               FastAPI app + Socket.IO ASGI mount
  config.py              pydantic-settings, reads .env
  core/
    security.py          JWT, bcrypt, RBAC dependencies
    validators.py        NIC / phone / email / file-type validation
    utils.py              ObjectId + Mongo doc serialization helpers
  db/
    mongodb.py             Motor client + collections + indexes
  routers/
    auth_router.py         register/login/complete-profile/forgot-reset/OTP
    user_router.py
    editor_router.py       listing, search/filter, profile CRUD
    request_router.py      project requests: create/accept/reject/deliver
    chat_router.py         message history (REST) — live chat is Socket.IO
    payment_router.py      escrow payment + 15/85 commission split
    review_router.py       1–5 star rating + 100+ char review
    admin_router.py        user/editor/payment mgmt, delivery verification
    upload_router.py       file upload (local disk; swap for Cloudinary/S3)
    notification_router.py
  sockets/
    socket_manager.py      Socket.IO events: connect (JWT auth), join_chat,
                            send_message, typing, notification broadcast
  schemas/                 Pydantic request/response models
scripts/
  create_admin.py          interactive admin account creator
nginx/editzone.conf         production reverse-proxy config
Dockerfile, docker-compose.yml
```

## AWS S3 uploads

Set `AWS_S3_BUCKET`, `AWS_REGION`, and AWS credentials in `.env`. You can also set
`AWS_S3_PUBLIC_BASE_URL` when serving objects through CloudFront or a custom domain. In production,
the API refuses uploads when S3 is not configured; local disk fallback is development-only.

## Core Business Logic

- **Roles**: `user`, `editor`, `admin` — enforced via `require_user` / `require_editor` / `require_admin` FastAPI dependencies (RBAC).
- **Registration flow**: `/auth/register` creates login credentials → `/auth/complete-profile` collects username/NIC/district/gender/phone → user redirected to Editors page or Editor Dashboard.
- **Request lifecycle**: `pending → accepted/rejected → in_progress (after payment) → delivered (editor uploads) → completed (admin approves, escrow released)`.
- **Escrow**: payment is captured and held (`escrow_status: held`). Only when an admin approves a delivered video does `PLATFORM_COMMISSION_PERCENT` (15%) get deducted and the remaining 85% marked for editor payout (`escrow_status: released`). Wire a real payout call (bank transfer API) in `admin_router.verify_delivery` where indicated.
- **Monthly admin escrow**: a client is charged `CLIENT_MONTHLY_ADMIN_FEE` (500 LKR by default) only once per calendar month. It is stored separately from project/editor earnings and remains held until an admin releases it from Payment Management.
- **Payments**: `payment_router.py` includes a mock gateway charge function — replace with real Stripe/PayHere SDK calls (both packages are in requirements.txt). A card ending in `0000` simulates a decline, useful for testing the frontend's failure states.
- **Real-time chat**: connect to Socket.IO at `/socket.io` with `{ auth: { token: <JWT> } }`. Emit `join_chat` with `{ request_id }`, then `send_message` with `{ request_id, text, file_url, file_type }`. Listen for `new_message` and `notification` events.
- **File uploads**: `/api/v1/uploads` validates extension/size and stores locally under `app/uploads/`, returning a URL. Swap the body of `upload_router.py` for real Cloudinary/S3 SDK calls when credentials are available — the response contract (`file_url`, `file_type`) stays the same, so the frontend needs no changes.

## Security Checklist Implemented
JWT auth · bcrypt password hashing (pinned 4.0.1) · role-based access control · NIC/phone/email validation · file type & size validation on upload · OTP-based forgot/reset password · email verification OTP · escrow-based payment protection · CORS allow-list · centralized error handling (no stack traces leaked to clients).

**Still to configure for full production readiness**: real SMTP creds for email delivery, Google OAuth client secret verification (`auth_router.google_login` is stubbed — see docstring), HTTPS termination (handled by Nginx/ALB, not the app itself), Cloudinary/S3 keys, Stripe/PayHere API keys, and a Redis-backed token blacklist if you need server-side JWT revocation on logout.
