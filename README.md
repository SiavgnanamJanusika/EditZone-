# EditZone — Full-Stack Video Editor Marketplace

Two-sided marketplace connecting clients with professional video editors, with real-time chat,
escrow-protected payments, and admin oversight.

## Contents
- `editzone-backend/` — FastAPI + MongoDB (Motor) + Socket.IO API. See its README for setup.
- `editzone-frontend/` — React + Vite + Tailwind client. See its README for setup.

## Quick Start (local dev)

**1. Backend**
```bash
cd editzone-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# make sure MongoDB is running (mongod) or set MONGO_URI to Atlas
uvicorn app.main:socket_app --reload --port 8000
python scripts/create_admin.py   # in a second terminal, create your admin login
```

**2. Frontend**
```bash
cd editzone-frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 — the landing page loads first, exactly per the spec: Home / About /
Why Us / Register in the nav, Choose Role → Login/Register → role-specific dashboards.

## What's implemented end-to-end
Landing/About/Why Us → Choose Role → 2-step registration (NIC/district/gender/phone validated) →
role-based redirect (Editors page for clients, Editor Dashboard for editors) → editor search/filter
by category → project requests (pending/accepted/rejected) → real-time Socket.IO chat with file
sharing → escrow payment (Visa/MasterCard/PayHere/Stripe forms, 15%/85% commission split) → editor
delivers final video via Choose File → admin verifies delivery → escrow released + video delivered
→ client leaves a 1–5 star, 100+ character review. Admin dashboard covers user/editor/payment
management and project monitoring, exactly as specified.

## What's stubbed for you to plug in production keys
- Google OAuth (`auth_router.google_login` — needs `GOOGLE_CLIENT_ID`)
- Real Stripe/PayHere charges (`payment_router._mock_gateway_charge` — swap for the real SDK calls;
  `stripe` and the PayHere pattern are already in `requirements.txt`)
- Cloudinary/S3 file storage (`upload_router.py` currently stores locally; response contract
  `{file_url, file_type}` stays identical so the frontend needs zero changes)
- SMTP email delivery for OTPs (currently logged to the backend console in dev)

See each package's own README for full details, folder structure, and API/route tables.
