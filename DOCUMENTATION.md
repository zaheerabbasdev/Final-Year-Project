# Kaarkun — Complete Project Documentation

Kaarkun is a full-stack, multi-platform **on-demand home services marketplace** that connects **customers** who need work done (plumbing, electrical, cleaning, etc.) with **service providers** who bid on and complete that work. It is a Final Year Project (FYP) demonstrating end-to-end engineering across a cloud-hosted backend API, an admin panel, a customer/provider web app, and a native mobile app — all deployed on AWS.

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AWS Cloud (ap-south-1)                       │
│                                                                        │
│   ┌─────────────┐     ┌──────────────────────────────────────────┐   │
│   │   AWS ECR    │     │         Application Load Balancer         │   │
│   │ (3 images)   │────►│  academy-dev-alb-*.ap-south-1.elb.       │   │
│   └─────────────┘     │  amazonaws.com                            │   │
│                        └────────┬──────────┬──────────┬───────────┘   │
│                                 │          │          │               │
│                    ┌────────────▼──┐  ┌────▼────┐  ┌─▼──────────┐   │
│                    │  ECS Fargate   │  │  ECS    │  │   ECS      │   │
│                    │  Backend API   │  │Frontend │  │  Admin     │   │
│                    │  Node.js 5000  │  │Next.js  │  │  Next.js   │   │
│                    └───────┬────────┘  └─────────┘  └────────────┘   │
│                            │                                          │
│              ┌─────────────┼──────────────────────┐                  │
│              │             │                      │                  │
│   ┌──────────▼──┐  ┌───────▼──────┐  ┌───────────▼──┐              │
│   │  MySQL RDS   │  │   AWS S3      │  │  AWS Secrets  │              │
│   │ kaarkun_db   │  │academy-dev-   │  │   Manager     │              │
│   │              │  │uploads        │  │ (JWT, DB creds│              │
│   └─────────────┘  └──────────────┘  │  email, keys) │              │
│                                       └───────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
              ▲                    ▲                    ▲
              │                   │                    │
   ┌──────────┴──────┐  ┌─────────┴──────┐  ┌─────────┴──────┐
   │   Flutter App    │  │  Customer/      │  │  Admin Panel    │
   │  Android / iOS   │  │  Provider Web   │  │  Next.js        │
   │  (Mobile)        │  │  Next.js        │  │  Staff/ops only │
   └─────────────────┘  └────────────────┘  └────────────────┘
```

All three frontends talk to the **same backend REST API** and the **same Socket.IO server** via the ALB. A job posted on mobile appears on the web app instantly; an admin action (suspend, verify) takes effect everywhere immediately.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express, MySQL (`mysql2/promise`), Socket.IO, JWT (`jsonwebtoken`), bcryptjs, Multer + `multer-s3` (file uploads → S3), Nodemailer (Gmail SMTP), express-rate-limit |
| Admin Panel | Next.js 15 (App Router), React, TypeScript, TailwindCSS, react-hot-toast |
| Web App | Next.js 15 (App Router), React, TypeScript, TailwindCSS, Axios |
| Mobile App | Flutter/Dart, Provider (state management), GoRouter (navigation), Dio (HTTP), socket_io_client, flutter_secure_storage, google_maps_flutter, geolocator, **flutter_foreground_task** (background GPS), image_picker, fluttertoast |
| AI / LLM | Groq (Llama 3.3 70B) → Google Gemini (1.5 flash) → Anthropic Claude (claude-3-haiku) — 3-tier cascading fallback chain; rule-based offline fallback if all fail |
| Geocoding / Maps | OpenStreetMap Nominatim (address search/reverse-geocode, backend-proxied), Google Maps SDK (mobile map rendering) |
| Cloud Infrastructure | AWS ECS Fargate (3 services), AWS ECR (3 image repos), AWS ALB (L7 load balancer), AWS RDS MySQL, AWS S3 (uploads bucket), AWS Secrets Manager (runtime secrets), Terraform (IaC) |
| CI/CD | GitHub Actions — on push to `master`: build 3 Docker images → push to ECR → update ECS services |

---

## 3. Database Schema (MySQL — `kaarkun_db`)

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | All user accounts (customers and providers) | `role` (customer/provider), `status` (pending/verified/rejected/blocked), `latitude`/`longitude`, `otp_code`/`otp_expiry` |
| `admins` | Separate staff accounts (not in `users`) | `username`, `email`, `password_hash`, `full_name` |
| `provider_profiles` | Extra data for provider accounts | `bio`, `skills` (JSON), `rating`, `total_jobs`, `success_rate`, `category_id`, `cnic_url`, `certificates_url`, `is_online`, `ai_confidence_score`, `ai_verification_notes` |
| `categories` | Service types | Plumber, Electrician, Carpenter, Painter, Cleaner, Gardener, AC Repair, Appliance Repair (seeded) |
| `jobs` | Customer-posted job requests | `budget` (PKR decimal), `location`, `lat`/`lng`, `images` (JSON array), `status` (open/active/completed/cancelled), `is_negotiable`, `is_emergency` |
| `bids` | Provider offers on a job | `amount` (PKR), `estimated_time`, `cover_letter`, `status` (pending/accepted/rejected) |
| `bookings` | Confirmed job-provider pairing | `status` (confirmed/in_progress/awaiting_confirmation/completed/cancelled), `verification_token` (QR/PIN handshake) |
| `reviews` | Post-job ratings | `rating` (1–5), `comment`; one review per booking (`UNIQUE` on `booking_id`) |
| `messages` | Chat between customer and provider per job | `content`, `image_url`, `is_read` |
| `notifications` | In-app notifications | `title`, `message`, `type`, `is_read` |
| `refresh_tokens` | JWT refresh-token rotation | `token`, `expires_at` |

All foreign keys cascade-delete appropriately (deleting a user removes their jobs, bids, bookings, messages, and notifications).

> **Schema management**: `backend/schema.sql` runs automatically on every server start via `initializeDatabase()` in `app.js` using `CREATE TABLE IF NOT EXISTS` — safe to re-run, never destructive.

---

## 4. Backend API Reference

**Production base URL**: `http://academy-dev-alb-*.ap-south-1.elb.amazonaws.com/api`  
**Local dev**: `http://localhost:5000/api`  
JWT is sent as `Authorization: Bearer <token>`.

### `/api/auth` — Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | none | Register as customer or provider. Accepts `multipart/form-data` (avatar, CNIC, certificates). Sends 6-digit OTP email to customers. Returns `{ requiresOTP, emailSent }`. |
| POST | `/login` | none (rate-limited: 10/15 min) | Email + password → `accessToken` + `refreshToken`. |
| POST | `/verify-otp` | none (rate-limited: 10/10 min) | Confirm the 6-digit OTP → sets `status=verified`. |
| POST | `/resend-otp` | none | Resend OTP to email. |
| POST | `/forgot-password` | none | Send password-reset OTP. |
| POST | `/reset-password` | none | Reset password using OTP token. |

### `/api/users` — Profile & Discovery

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | JWT | Get the logged-in user's full profile. |
| PUT | `/me` | JWT | Update profile fields. |
| DELETE | `/me` | JWT | Delete own account. |
| PATCH | `/me/online-status` | JWT | Provider toggles online/offline availability. |
| POST | `/me/avatar` | JWT | Upload/replace profile photo → S3. |
| GET | `/providers/top` | none | Top-rated providers (homepage). |
| GET | `/providers` | none | All providers (filterable by category). |
| GET | `/providers/:id` | none | Provider public profile. |
| GET | `/:id` | none | Any user by ID. |

### `/api/categories`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | List all service categories. |
| POST | `/` | admin | Create a category. |
| DELETE | `/:id` | admin | Delete a category. |

### `/api/jobs` — Job Lifecycle

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | Browse open jobs. Provider callers get proximity-filtered results (20 km radius). |
| POST | `/` | customer | Post a new job (up to 6 images → S3). Notifies every provider in the matching category. |
| GET | `/my/jobs` | JWT | Jobs posted by the current user. |
| GET | `/:id` | none | Job details. |
| PUT | `/:id` | customer (owner) | Edit a job. |
| DELETE | `/:id` | customer (owner) | Delete a job. |
| POST | `/:id/express-accept` | provider | **Emergency instant-accept**: skips bidding — first provider to tap is immediately booked. Race-condition-safe via atomic DB transaction. |

### `/api/bids`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | provider | Place a bid (amount, estimated time, cover letter). |
| GET | `/job/:jobId` | JWT | All bids on a given job. |
| GET | `/my/bids` | provider | Bids placed by the current provider. |
| PUT | `/:id/accept` | customer | Accept a bid → creates a booking, marks the job `active`. Atomic — two concurrent accepts cannot both succeed. |

### `/api/bookings` — Confirmed Work

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/my` | JWT | All bookings for the current user (as customer or provider). |
| GET | `/job/:jobId` | JWT | Booking tied to a specific job. |
| PUT | `/job/:jobId/status` / `/:id/status` | JWT (participant) | Advance booking status through the lifecycle. |
| POST | `/:id/handshake/generate` | provider | Generate a random 6-digit PIN to prove physical on-site arrival. Shown as a QR code on mobile, plain PIN on web. |
| POST | `/:id/handshake/verify` | customer | Customer scans/enters the PIN → booking moves to `in_progress`. Token is single-use (cleared after verification). |
| PUT | `/:id/cancel` | participant | Cancel a confirmed/in-progress booking → reopens the job, resets the accepted bid, notifies the other party. |

### `/api/messages` — Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/list` | JWT | Chat thread list (all conversations). |
| GET | `/:jobId/:otherUserId` | JWT | Message history for one job conversation. |
| POST | `/send` | JWT | Send a message (text and/or image → S3). Authorized only between legitimate job participants. |
| PUT | `/read/:jobId/:senderId` | JWT | Mark messages in a thread as read. |

### `/api/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Submit a 1–5 star review for a completed booking (one per booking). |
| GET | `/provider/:providerId` | none | All reviews for a provider. |
| GET | `/booking/:bookingId` | none | Review for a specific booking. |

### `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List the user's notifications. |
| GET | `/unread-count` | JWT | Badge count. |
| PUT | `/mark-all-read` | JWT | Mark all as read. |
| PATCH | `/:id/read` | JWT | Mark one as read. |
| DELETE | `/` | JWT | Clear all notifications. |

### `/api/geocode` — Location (proxies OpenStreetMap Nominatim, Pakistan-biased)

| Method | Path | Description |
|---|---|---|
| GET | `/autocomplete?input=` | Address search-as-you-type. |
| GET | `/search?q=` | Address → lat/lng. |
| GET | `/reverse?lat=&lon=` | Lat/lng → human-readable address. |

### `/api/ai` — Smart Features

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/matching-jobs` | provider | **Smart job matching**: scores every open job for this provider (category, GPS proximity via Haversine, rating, emergency bonus) and returns ranked results with human-readable match reasons. |
| GET | `/suggest-bid/:jobId` | JWT | **Bid price suggestion**: analyzes historical accepted bids in the same category; falls back to ±15–20% of the stated budget if fewer than 3 data points exist. |
| POST | `/autocomplete` | JWT | **Job-description autocomplete**: LLM returns a complete description, suggested category, and PKR budget from a partial input. Offline keyword-template fallback when no LLM is available. |
| POST | `/support-chatbot` | JWT | **Support chatbot**: LLM with live DB context injected (online provider count, open jobs, user stats). Offline FAQ fallback. |
| GET | `/fraud-reviews` | admin | **Review fraud detection**: flags velocity anomalies (<120 s between booking and review) and reciprocal rating collusion between the same pair. |

### `/api/admin` — Staff Console

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | `ADMIN_SETUP_KEY` | One-time admin account creation. |
| POST | `/auth/login` | none | Admin login → admin JWT. |
| GET | `/stats` | admin | KPI dashboard: totals, 12-month signup trend, top-5 categories. |
| GET/DELETE | `/users`, `/users/:id` | admin | List, inspect, delete users. |
| PUT | `/users/:id/status` | admin | Verify / reject / suspend a user (with reason + email notification). |
| POST | `/providers/:id/auto-verify` | admin | **AI-assisted KYC**: runs uploaded CNIC through Gemini Vision for confidence score + notes. |
| GET/DELETE | `/jobs`, `/jobs/:id` | admin | Moderate job listings. |
| POST | `/jobs/:id/summarize-dispute` | admin | **AI dispute summarizer**: feeds the full chat transcript to the LLM chain, returns structured 3-part summary. |
| GET | `/bids` | admin | Platform-wide bid visibility. |
| GET/POST/DELETE | `/categories` | admin | Manage service categories. |

---

## 5. The AI Layer (`backend/services/aiService.js`)

Kaarkun uses a **3-tier LLM fallback chain** so AI features keep working even when a provider is rate-limited or a key is unconfigured:

1. **Groq** (`llama-3.3-70b-versatile`) — tried first; free and fast.
2. **Google Gemini** (`gemini-1.5-flash`) — tried if Groq fails or returns 429.
3. **Anthropic Claude** (`claude-3-haiku-20240307`) — final paid fallback.
4. **Rule-based offline fallback** — hand-written keyword/template logic; never returns an error to the user even with zero API keys configured.

**Seven AI-powered features:**

| Feature | Method | Notes |
|---|---|---|
| Smart job-provider matching | Scoring algorithm (math) | Category match + Haversine GPS proximity + rating + emergency bonus |
| Bid price suggestion | Historical-data driven | Needs ≥3 historical bids in the category; falls back to budget ±15% |
| Job description autocomplete | LLM + offline templates | Returns description, category, PKR budget |
| Support chatbot | LLM + live DB context | Knows current online providers, open jobs, user's own stats |
| Review fraud detection | Rule-based pattern matching | Velocity anomaly + reciprocal collusion detection |
| AI dispute summarizer | LLM (admin-only) | Reads full chat transcript → structured 3-part summary |
| KYC CNIC verification | **Gemini Vision** (multimodal) | No fallback chain — requires Gemini with billing enabled |

> **KYC note**: Gemini Vision requires a Google Cloud project with billing enabled for non-zero quota. Without it, auto-verify returns `{ confidence: null, notes: 'verify manually' }` — admin can still manually approve/reject providers. This is an assist feature, not a hard dependency.

---

## 6. Real-Time Features (Socket.IO)

The backend runs Socket.IO alongside the REST API (`backend/socketManager.js`), authenticated via JWT handshake. Each connected user auto-joins their private room (`user_<userId>`).

| Feature | Events | Notes |
|---|---|---|
| Live chat | `new_message`, `typing`, `user_stop_typing`, `read_receipt` | Scoped per job conversation room |
| In-app notifications | `new_notification` | Instant push — no polling |
| Live GPS tracking | `location_update` (provider→server), `provider_location` (server→customer), `location_stopped` | Mobile-only feature; foreground service keeps it alive when screen is off |

**GPS tracking architecture** (mobile):
```
Android Foreground Service (persistent notification shown)
  └── Background Dart isolate (LocationForegroundHandler)
        ├── Geolocator stream  distanceFilter: 3 m  → fires on real movement
        └── onRepeatEvent  every 4 s  → heartbeat re-emits last position
              │
              ▼ IPC (FlutterForegroundTask.sendDataToMain)
        Main isolate (LocationTrackingService)
              └── socket.emitLocationUpdate() → backend → customer's TrackProviderScreen
```

Customer tracking screen features:
- **Smooth marker animation** — marker glides between GPS updates (1.2 s ease-in-out, same as Careem/Uber)
- **Smart camera follow** — zooms to level 16 on first fix, then pans only (preserves customer's zoom)
- **3-state status chip** — ⏳ WAITING (no fix yet) → 📶 SIGNAL LOST (no update > 8 s) → 🟢 LIVE (active)
- **ETA estimate** — straight-line distance to job location; walking speed (<500 m) or vehicle speed (≥500 m)
- **"On their way" banner** — SnackBar fires on the very first GPS fix received

---

## 7. Admin Panel (`admin/`)

Runs on Next.js with a separate login (`admins` table, not `users`).

| Page | Features |
|---|---|
| `/login`, `/signup` | Admin authentication (signup gated by `ADMIN_SETUP_KEY`) |
| `/dashboard` | Real KPI cards, 12-month signup trend chart, top-5 popular categories — all live SQL aggregates |
| `/dashboard/users` | View/suspend (with reason)/unsuspend/delete customers; CSV export |
| `/dashboard/providers` | View profile + CNIC/certificates, AI-assisted KYC auto-verify, approve/reject/suspend |
| `/dashboard/jobs` | Job moderation, AI dispute summarizer |
| `/dashboard/bids` | Platform-wide bid visibility |
| `/dashboard/categories` | Add/delete service categories |

Security: JWT stored client-side, auto logout on 401, all destructive actions behind confirm dialogs.

---

## 8. Customer/Provider Web App (`web/kaarkun/`)

| Area | Pages | Features |
|---|---|---|
| Auth | `/login`, `/register`, `/verify-otp`, `/forgot-password` | Role selection, password-strength validation, OTP email verification, 60 s resend cooldown |
| Shared | `/profile`, `/notifications`, `/chat`, `/support-chatbot` | Profile editing, live notification feed, real-time chat, AI support chatbot |
| Customer | `/customer/dashboard`, `/customer/jobs`, `/customer/jobs/[id]`, `/customer/post-job`, `/customer/bookings`, `/customer/submit-review` | Post jobs with photos/budget/location (address autocomplete), review bids, track bookings, **enter provider's arrival PIN**, leave reviews |
| Provider | `/provider/dashboard`, `/provider/browse-jobs`, `/provider/bids`, `/provider/[id]` | Browse/filter open jobs, place bids with AI price suggestions, **generate arrival PIN**, public profile page |

---

## 9. Mobile App (`mobile/`)

Flutter app targeting Android and iOS. Primary end-user client.

### Auth & Onboarding (`features/auth/`)
Splash screen, onboarding carousel, login, signup (with file picker for avatar/CNIC/certificates), OTP verification with resend, forgot/reset password.

### Customer Features (`features/customer/`)
- Home screen (category browse, top providers, emergency job shortcut)
- Post a job (photos, budget, location picker, negotiable/emergency flags, AI description autocomplete)
- My Jobs (track status, view/accept bids)
- **Track Provider screen** — live GPS map while provider is en route:
  - Android Foreground Service (`flutter_foreground_task`) keeps GPS alive with screen off
  - Smooth Careem/Uber-style marker animation
  - ETA estimate updated on every GPS fix
  - 3-state status chip (WAITING / SIGNAL LOST / LIVE)
  - "On their way!" banner on first fix

### Provider Features (`features/provider/`)
- Dashboard (online/offline toggle, stats)
- Browse Jobs (proximity-filtered, AI smart-matched with reasons, emergency express-accept)
- Place Bid (AI price suggestion inline)
- My Bids (track bid status, start GPS tracking on accepted bookings)
- Reviews (see customer feedback)

### Chat (`features/chat/`)
Chat list, real-time chat room (text + images, typing indicators), AI support chatbot.

### Shared Screens (`shared/`)
- Job detail, customer/provider profile screens, settings (dark/light theme, currency, language)
- **QR Handshake screen** — provider shows QR/PIN on arrival, customer scans/enters to start the job
- Map location picker (Google Maps)
- Submit review screen
- Bottom-nav shell with role-based tabs

### Core Infrastructure (`core/`)
| File | Role |
|---|---|
| `api_client.dart` | Dio HTTP client; 403 → show toast only (never logout); 401 → logout |
| `token_storage.dart` | JWT stored in OS keystore via `flutter_secure_storage` |
| `socket_service.dart` | JWT-authenticated Socket.IO; auto-reconnect; re-joins rooms on reconnect |
| `location_tracking_service.dart` | Provider-side GPS: starts/stops foreground service, relays positions via socket |
| `foreground_location_task.dart` | Background isolate handler: GPS stream (distanceFilter: 3 m) + 4 s heartbeat |

---

## 10. AWS Infrastructure (Terraform — `terraform/`)

**Region**: `ap-south-1` (Mumbai)

| Resource | Details |
|---|---|
| VPC | `10.0.0.0/16`, 2 public + 2 private subnets |
| ALB | Internet-facing, listeners on port 80; routes `/api/*` and `/socket.io/*` to backend, `/admin*` to admin, everything else to frontend |
| ECS Cluster | `academy-dev-cluster` |
| ECS Services | `academy-dev-backend`, `academy-dev-frontend`, `academy-dev-admin` |
| ECR Repos | `academy-dev-backend`, `academy-dev-frontend`, `academy-dev-admin` |
| RDS | MySQL 8, `kaarkun_db` |
| S3 Bucket | `academy-dev-uploads` (avatars, job images, chat attachments) |
| Secrets Manager | `EMAIL_USER`, `EMAIL_PASS`, `JWT_SECRET`, `DB_PASSWORD` — injected as env vars into ECS task at runtime |

**Apply command:**
```bash
cd terraform
terraform apply -var-file=terraform.tfvars -var-file=secrets.tfvars -auto-approve
```

> ⚠️ When Terraform recreates the ALB the DNS suffix changes. Update the ALB hostname in 3 places: `web/kaarkun/next.config.ts` (remotePatterns), `.github/workflows/deploy-aws.yml` (both `NEXT_PUBLIC_API_URL` build args), `mobile/lib/core/api_client.dart` (defaultValue).

---

## 11. CI/CD Pipeline (`.github/workflows/deploy-aws.yml`)

Triggered on push to `master`.

1. Configure AWS credentials (GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Login to ECR
3. Build + push **backend** Docker image (no build args — secrets injected from Secrets Manager at runtime)
4. Build + push **frontend** Docker image (with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`)
5. Build + push **admin** Docker image (with `NEXT_PUBLIC_API_URL`)
6. Register new backend ECS task definition (preserves Secrets Manager secret refs)
7. Update all 3 ECS services with new image tags → rolling deploy

---

## 12. Security Measures

- **Password hashing**: bcryptjs (cost factor 12) for both user and admin accounts.
- **JWT auth** with role enforcement (`authorize('customer'|'provider')`) and a separate `adminAuth` middleware that checks the `admins` table — a regular user token cannot impersonate an admin.
- **Account status enforcement**: blocked/rejected users are locked out at middleware level (`suspendedCheck`) on every request.
- **Rate limiting**: login (10/15 min) and OTP verification (10/10 min) to blunt brute-force attempts.
- **HTTP 403 vs 401**: mobile `api_client.dart` distinguishes them — 403 (business logic denial, e.g. bidding on an already-booked job) shows a toast; only 401 (expired JWT) triggers logout.
- **File upload validation**: Multer restricts to image MIME types and a 5 MB size cap; files go to S3 (not local disk).
- **CORS allow-list**: explicit production origins; `localhost` only for local dev.
- **Secrets hygiene**: all sensitive values in AWS Secrets Manager (production) or `.env` gitignored (local); no hardcoded secrets in source.
- **Mobile secure storage**: JWT stored in OS keystore via `flutter_secure_storage` — not plaintext SharedPreferences.
- **Socket.IO auth**: connections require a valid JWT handshake.
- **Chat authorization**: sending a message requires the sender/receiver pair to correspond to actual job participants.
- **Race-condition-safe job claiming**: bid acceptance and express-accept both use an atomic DB transaction (`UPDATE jobs SET status='active' WHERE id=? AND status='open'`) — two concurrent accepts cannot both succeed.

---

## 13. Configuration Reference

### Backend (`backend/.env` local / AWS Secrets Manager in production)

| Variable | Purpose |
|---|---|
| `PORT` | Backend listen port (default 5000) |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing keys (long random hex) |
| `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY` | Token lifetimes (e.g. `7d`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS allow-list |
| `AWS_REGION` | AWS region (e.g. `ap-south-1`) |
| `AWS_S3_BUCKET` | S3 bucket name (`academy-dev-uploads`) |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail + App Password for Nodemailer |
| `GROQ_API_KEY`, `GEMINI_API_KEY`, `CLAUDE_API_KEY` | LLM provider keys for AI fallback chain |

### Frontends

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | admin, web | Backend REST base URL |
| `NEXT_PUBLIC_WS_URL` | web | Backend Socket.IO URL |
| `--dart-define=API_BASE_URL=` | mobile | Overrides default backend URL at build time |
| `MAPS_API_KEY` | mobile (`local.properties`) | Google Maps key — gitignored, never committed |

---

## 14. Complete Feature Checklist

### Account & Identity
- [x] Role-based signup (customer / provider)
- [x] Email OTP verification with 60 s resend cooldown
- [x] Login / JWT auth with refresh tokens
- [x] Forgot password / reset password flow
- [x] Profile editing + avatar upload (→ S3)
- [x] Provider KYC: CNIC + certificate upload, admin manual review, AI-assisted confidence scoring (Gemini Vision)
- [x] Admin-controlled account states: pending / verified / rejected / blocked (with reason + email notification)

### Jobs & Bidding
- [x] Post a job (title, description, category, budget, location, photos, date/time, negotiable flag, emergency flag)
- [x] AI-assisted job description autocomplete + budget/category suggestion
- [x] Browse/filter open jobs (proximity-aware for providers, 20 km radius)
- [x] AI smart job-provider matching with explainable scoring and reasons
- [x] Place / accept / reject bids
- [x] AI bid price suggestion based on historical accepted bids
- [x] Emergency jobs with instant express-accept (skips bidding, race-condition-safe)
- [x] Edit / delete own job postings

### Bookings & Job Execution
- [x] Booking creation on bid acceptance (atomic, race-condition-safe)
- [x] Arrival handshake: QR/PIN on mobile, PIN entry on web — proves physical on-site presence
- [x] Status lifecycle: confirmed → in_progress → awaiting_confirmation → completed
- [x] Booking cancellation with automatic job reopening and bid reset
- [x] **Live GPS tracking of provider en route** (Android Foreground Service — survives screen off)
- [x] **Smooth Careem/Uber-style animated map marker**
- [x] **ETA estimate on tracking screen** (auto-updated every GPS fix)
- [x] **3-state tracking chip**: WAITING / SIGNAL LOST / LIVE
- [x] **"On their way!" notification** on first GPS fix received
- [x] Affected-party notification when the other side of an active booking is suspended

### Communication
- [x] Real-time chat per job (text + image attachments → S3, typing indicators, read receipts)
- [x] In-app notifications (real-time via Socket.IO, unread badge)
- [x] AI support chatbot with live app-context awareness

### Reviews & Trust
- [x] 1–5 star reviews, one per booking (DB-enforced)
- [x] Provider rating and success-rate aggregation
- [x] AI review fraud/anomaly detection (admin-only)
- [x] AI dispute summarization from chat transcripts (admin-only)

### Admin Operations
- [x] Real-time dashboard analytics (signup trend, category popularity, platform totals)
- [x] User management (view/suspend/unsuspend/delete, with reason + email notification)
- [x] Provider verification workflow (manual + AI-assisted Gemini Vision KYC)
- [x] Job moderation (view/delete, AI dispute summary)
- [x] Bid oversight
- [x] Category management
- [x] CSV export of customer data

### Cross-Platform & Infrastructure
- [x] Same backend API powering mobile, web app, and admin panel
- [x] Dark/light theme support (mobile + web)
- [x] Multi-currency display support (PKR / USD / AED)
- [x] Multi-language support (mobile)
- [x] Full AWS cloud deployment (ECS Fargate, RDS, S3, ALB, Secrets Manager)
- [x] GitHub Actions CI/CD (push to master → auto-deploy all 3 services)
- [x] Terraform IaC for reproducible infrastructure

---

## 15. Local Development

### Backend
```bash
cd e:/fyp/backend
npm install
# Ensure MySQL is running with kaarkun_db
node app.js   # runs on port 5000
```

### Web (Customer + Provider)
```bash
cd e:/fyp/web/kaarkun
npm install
npm run dev   # port 3000
```

### Admin
```bash
cd e:/fyp/admin
npm install
npm run dev   # port 3001
```

### Mobile
```bash
cd e:/fyp/mobile
flutter pub get
# Android emulator:
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api
# iOS simulator:
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api
# Release APK:
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

---

## 16. Common Issues & Solutions

| Issue | Cause | Fix |
|---|---|---|
| `ClusterNotFoundException` in GitHub Actions | ECS cluster destroyed/inactive; or AWS region outage | Run `terraform apply` to recreate; or wait for AWS recovery and re-run the failed job |
| ALB DNS changed after `terraform apply` | Terraform recreated the ALB | Update hostname in 3 files (see §10) |
| OTP email not sending | `EMAIL_USER`/`EMAIL_PASS` missing or Gmail App Password invalid | Check AWS Secrets Manager; ensure `secrets.tfvars` was used in `terraform apply` |
| Provider logout when bidding on accepted job | `api_client.dart` was treating 403 same as 401 | Fixed: 403 shows toast only; 401 triggers logout |
| "Waiting for provider" never clears | GPS stream with large `distanceFilter` never fired when stationary | Fixed: foreground service heartbeat re-emits last position every 4 s |
| GPS stops when screen is off | Dart timer paused by Android OS | Fixed: `flutter_foreground_task` Android Foreground Service keeps process alive |
| Marker teleports on GPS update | Map marker jumped instantly to new coordinates | Fixed: `AnimationController` + `Tween<double>` for 1.2 s smooth glide |
| `onStart` signature error (foreground task) | `flutter_foreground_task` v8.17.0 changed API vs v8.13.0 | Fixed: added `TaskStarter starter` 2nd parameter to `onStart` |
| `const` error on `ForegroundTaskEventAction.repeat` | Same package version change | Fixed: removed `const` from `ForegroundTaskOptions` |
| `Invalid Date` in chat | `new Date(null).toLocaleDateString()` | Use `formatDate()` helper that returns `''` for null/bad dates |
| Bid amount has decimals | `.toFixed()` instead of `Math.round()` | Always `Math.round(convertFromPkr(amount))` |
| AI category not matching on job autocomplete | Exact string mismatch | `findCategory()` fuzzy matcher in post-job page handles contains-match in either direction |
