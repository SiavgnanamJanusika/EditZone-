# EditZone — Frontend

React + Vite client for the EditZone video-editor marketplace, styled with Tailwind CSS,
talking to the FastAPI backend via REST + Socket.IO.

## Tech
React.js · Vite · Tailwind CSS · React Router · Axios · Socket.IO Client · lucide-react

## Setup

```bash
npm install
cp .env.example .env     # point at your backend URL if not localhost:8000
npm run dev
```

App runs at http://localhost:5173 — make sure the backend is running at
http://localhost:8000 (see ../editzone-backend/README.md).

## Build

```bash
npm run build   # outputs to dist/
npm run preview
```

## What's wired up

- **Landing / About / Why Us** — public marketing pages
- **Choose Role → Register → Login → Complete Profile** — full 2-step registration flow with
  NIC/phone/district validation, matching the backend's `/auth/*` endpoints
- **Editors Page** — live search + category filtering (All / Image Editor / TikTok Editor / Video Editor)
- **Editor Profile** — bio, skills, portfolio, reviews, "Send Request" flow
- **Editor Dashboard** — tabs for new requests / active projects / completed, accept/reject actions,
  live notifications via Socket.IO
- **Editor Profile Edit** — profile picture upload, portfolio uploads, skills, hourly rate, bio, category
- **Chat** (`/chat/:requestId` for clients, `/editor/chat/:requestId` for editors) — real-time
  messaging over Socket.IO, file/image/video/zip/audio attachments via the upload endpoint, and (for
  editors) a "Choose File" button to submit the final delivered video
- **Payment** — project details + Visa/MasterCard/PayHere/Stripe card form, calls the escrow payment
  endpoint, then routes to Payment Success → Order History
- **Order History** — all requests with status badges, contextual actions (Open Chat / Pay Now / View
  More Editors on rejection / Leave a Review on completion with the 100-character minimum enforced
  client-side too)
- **Admin** — sidebar layout with Overview (stats), Users (ban/unban), Editors, Payments (escrow status),
  Projects (approve/reject delivered videos → releases escrow)

## Notes for going to production

- Replace the "Continue with Google" buttons' click handler with real Google Identity Services once
  `VITE_GOOGLE_CLIENT_ID` is set and the backend's `auth_router.google_login` is implemented.
- `VITE_STRIPE_PUBLIC_KEY` is reserved for wiring up Stripe.js/Stripe Elements on the card form when
  you move off the backend's mock gateway.
- The uploaded logo PNG is used as both favicon and in-app logo; swap `src/assets/logo-full.png` and
  `public/favicon.png` for a vector/optimized version before shipping — the current PNG is large.

## Deployment (Nginx on EC2)

```bash
npm run build
```

```nginx
server {
    listen 80;
    server_name editzone.com;
    root /var/www/editzone-frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```
