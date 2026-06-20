# Kaarkun — Complete Project Documentation

Kaarkun is a full-stack, multi-platform **on-demand home services marketplace** that connects **customers** who need work done (plumbing, electrical, cleaning, etc.) with **service providers** who bid on and complete that work. It is a Final Year Project (FYP) demonstrating end-to-end engineering across a backend API, an admin panel, a customer/provider web app, and a native mobile app.

---

## 1. High-Level Architecture

```
                            ┌─────────────────────────┐
                            │   MySQL Database         │
                            │   (kaarkun_db)            │
                            └───────────┬──────────────┘
                                        │
                            ┌───────────▼──────────────┐
                            │   Backend API              │
                            │   Node.js + Express 5      │
                            │   Port 5000                │
                            │   - REST API (/api/...)    │
                            │   - Socket.io (real-time)  │
                            │   - JWT auth               │
                            │   - AI service (LLM chain) │
                            └───┬────────┬────────┬─────┘
                                │        │        │
              ┌─────────────────┘        │        └────────────────────┐
              │                          │                             │
    ┌─────────▼─────────┐     ┌──────────▼──────────┐      ┌───────────▼───────────┐
    │  Admin Panel        │     │  Customer/Provider   │      │  Mobile App            │
    │  Next.js (web)       │     │  Web App              │      │  Flutter (Android/iOS/ │
    │  Port 3000            │     │  Next.js, Port 3001    │      │  Web/Desktop)           │
    │  Staff/ops only        │     │  Public-facing          │      │  Primary end-user app   │
    └────────────────────┘     └──────────────────────┘      └────────────────────────┘
```

All three frontends (admin, web, mobile) talk to the **same backend REST API** and the **same Socket.io server**, so a job posted on mobile shows up identically on the web app, and an admin action (suspend, delete) takes effect everywhere immediately.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, MySQL (`mysql2`), Socket.io, JWT (`jsonwebtoken`), bcryptjs, Multer (file uploads), Nodemailer (email), express-rate-limit |
| Admin Panel | Next.js 16, React 19, TypeScript, TailwindCSS 4, react-hot-toast |
| Web App | Next.js 16, React 19, TypeScript, TailwindCSS 4, lucide-react |
| Mobile App | Flutter/Dart, Provider (state management), GoRouter (navigation), Dio (HTTP), socket_io_client, flutter_secure_storage, image_picker, google_maps_flutter |
| AI / LLM | Groq (Llama 3.3 70B, free) → Google Gemini (free) → Anthropic Claude (paid) — cascading fallback chain, plus rule-based offline fallback |
| Geocoding/Maps | OpenStreetMap Nominatim (search/reverse-geocode, backend-proxied), Google Maps SDK (mobile map rendering) |

---

## 3. Database Schema (MySQL — `kaarkun_db`)

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | All accounts (customers, providers, and a `role` flag for admin-like access) | `role` (customer/provider/admin), `status` (pending/verified/rejected/blocked), `status_reason`, `latitude`/`longitude`, `otp_code`/`otp_expiry` |
| `provider_profiles` | Extra data only for provider accounts | `bio`, `skills` (JSON), `rating`, `total_jobs`, `success_rate`, `category_id`, `cnic_url`, `certificates_url`, `is_online`, `ai_confidence_score`, `ai_verification_notes` |
| `categories` | Service types | `Plumber, Electrician, Carpenter, Painter, Cleaner, Gardener, AC Repair, Appliance Repair` (seeded) |
| `jobs` | Customer-posted job requests | `budget`, `location`, `latitude`/`longitude`, `images` (JSON array), `status` (open/active/completed/cancelled), `is_negotiable`, `is_emergency`, `ai_dispute_summary` |
| `bids` | Provider offers on a job | `amount`, `estimated_time`, `cover_letter`, `status` (pending/accepted/rejected) |
| `bookings` | A confirmed job-provider pairing | `status` (confirmed/in_progress/awaiting_confirmation/completed/cancelled), `verification_token` (QR handshake PIN) |
| `reviews` | Post-job ratings | `rating` (1–5, DB-enforced via `CHECK`), `comment`; one review per booking (`UNIQUE` on `booking_id`) |
| `messages` | Chat between customer & provider, per job | `content`, `image_url`, `is_read` |
| `admins` | Separate table from `users` — staff accounts | `username`, `email`, `password_hash` |
| `notifications` | In-app notifications | `title`, `message`, `type`, `is_read` |
| `refresh_tokens` | JWT refresh-token rotation | `token`, `expires_at` |

All foreign keys cascade-delete appropriately (e.g. deleting a user removes their jobs/bids/bookings).

---

## 4. Backend API Reference

Base URL: `http://<host>:5000/api`. JWT is sent as `Authorization: Bearer <token>`.

### `/api/auth` — Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | none | Register as customer or provider. Accepts file uploads (avatar, CNIC, certificates) via `multipart/form-data`. Sends an OTP email. |
| POST | `/login` | none (rate-limited: 10/15min) | Email+password login → JWT. |
| POST | `/verify-otp` | none (rate-limited: 10/10min) | Confirms the 6-digit email OTP sent at registration, activating the account. |

### `/api/users` — Profile & Discovery
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | JWT | Get the logged-in user's full profile. |
| PUT | `/me` | JWT | Update profile fields. |
| PATCH | `/me/online-status` | JWT | Provider toggles online/offline availability. |
| POST | `/me/avatar` | JWT | Upload/replace profile photo. |
| GET | `/providers/top` | none | Top-rated providers (for homepage/marketing). |
| GET | `/providers/:id` / `/providers` | none | Provider detail / provider directory (browsable by category). |
| GET | `/:id` | none | Public-safe user lookup by ID. |

### `/api/categories`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | List all service categories. |

### `/api/jobs` — Job Lifecycle
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | Browse open jobs. If the caller is a logged-in **provider**, results are auto-filtered to a 20 km radius around their GPS/profile location. |
| POST | `/` | customer | Post a new job (up to 6 images). Auto-notifies every provider in the matching category (and flags emergency jobs distinctly). |
| GET | `/my/jobs` | JWT | Get jobs posted by the current customer. |
| POST | `/:id/express-accept` | provider | **Emergency instant-accept**: skips the bidding flow entirely — first provider to tap "accept" on an emergency job is immediately booked. |
| GET | `/:id` | none | Job details. |
| PUT | `/:id` | customer (owner) | Edit a job. |
| DELETE | `/:id` | customer (owner) | Delete a job. |

### `/api/bids`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | provider | Place a bid (amount, estimated time, cover letter) on a job. |
| GET | `/job/:jobId` | JWT | All bids on a given job (for the customer reviewing offers). |
| GET | `/my/bids` | provider | Bids placed by the current provider. |
| PUT | `/:id/accept` | customer | Accept a bid → creates a `booking`, marks the job `active`. |

### `/api/bookings` — Confirmed Work
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/my` | JWT | Bookings for the current user (as customer or provider). |
| GET | `/job/:jobId` | JWT | Booking tied to a specific job. |
| PUT | `/job/:jobId/status` / `/:id/status` | JWT (participant) | Advance booking status. `completed` auto-marks the job completed and notifies the provider; `awaiting_confirmation` notifies the customer to confirm. |
| POST | `/:id/handshake/generate` | provider (owner) | **Arrival handshake**: provider generates a random 6-digit PIN to prove they're physically on-site. Surfaced as a scannable QR code on mobile and a plain PIN display on the web app. |
| POST | `/:id/handshake/verify` | customer (owner) | Customer scans (mobile) or types in (web) the PIN to confirm the provider arrived → booking moves to `in_progress`; token is single-use (cleared after verification). |
| PUT | `/:id/cancel` | participant | Cancel a `confirmed`/`in_progress` booking — reopens the job, resets/deletes the accepted bid so other providers can bid again, notifies the other party. |

> **Note:** `acceptBid` and `expressAccept` claim a job atomically (`UPDATE jobs SET status='active' WHERE id=? AND status='open'` inside a transaction), so two concurrent accept/express-accept attempts on the same job can never both succeed — the loser gets a clean `409 Conflict` instead of a duplicate booking. `findByJobId`-style lookups always return the most recent booking for a job (`ORDER BY id DESC LIMIT 1`), so a job that was cancelled and successfully rebooked doesn't resolve to its stale, cancelled booking.

### `/api/admin` — Staff/Ops Console
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | `ADMIN_SETUP_KEY` (env secret) | One-time admin account creation gate. |
| POST | `/auth/login` | none (rate-limited) | Admin login → admin JWT. |
| GET | `/stats` | admin | Dashboard aggregates: user/job/bid/category counts, 12-month signup trend, top-5 categories by job volume. |
| GET/DELETE | `/users`, `/users/:id` | admin | List, inspect, delete users. |
| PUT | `/users/:id/status` | admin | Verify / reject / suspend a user, with an optional reason (emails the user). If the user is suspended (`blocked`) and has any `confirmed`/`in_progress` bookings, the other party on each booking gets a real-time notification that their booking is affected, since suspension doesn't auto-cancel anything. |
| POST | `/providers/:id/auto-verify` | admin | **AI-assisted KYC**: runs the uploaded CNIC image through Gemini Vision to auto-suggest a confidence score + notes for manual review. |
| GET/DELETE | `/jobs`, `/jobs/:id` | admin | Moderate job listings. |
| POST | `/jobs/:id/summarize-dispute` | admin | **AI dispute summarizer**: feeds the full chat transcript to the LLM chain and returns a structured 3-part summary (customer's claim / provider's claim / recommendation). |
| GET | `/bids` | admin | All bids platform-wide. |
| GET/POST/DELETE | `/categories` | admin | Manage service categories. |

### `/api/reviews`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Submit a 1–5 star review for a completed booking (one per booking, DB-enforced). |
| GET | `/provider/:providerId` | none | All reviews for a provider. |
| GET | `/booking/:bookingId` | none | The review tied to one booking. |

### `/api/notifications`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List the user's notifications. |
| GET | `/unread-count` | JWT | Badge count. |
| PUT | `/mark-all-read` / `/:id/read` | JWT | Mark as read. |

### `/api/messages` — Chat
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/list` | JWT | Chat thread list (conversations grouped by job + other participant). |
| GET | `/:jobId/:otherUserId` | JWT | Message history for one job conversation. |
| POST | `/send` | JWT | Send a message (text and/or image attachment). Authorized only between a job's customer and a legitimate counterpart on that job (a bidder or the booked provider) — an arbitrary user ID can't be messaged just by guessing it. |
| PUT | `/read/:jobId/:senderId` | JWT | Mark a thread as read. |

### `/api/geocode` — Location Search (proxies OpenStreetMap Nominatim, biased to Pakistan)
| Method | Path | Description |
|---|---|---|
| GET | `/autocomplete?input=` | Address search-as-you-type suggestions. |
| GET | `/search?q=` | Text address → lat/lng. |
| GET | `/reverse?lat=&lon=` | Lat/lng → human-readable address. |

### `/api/ai` — Smart Features
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/matching-jobs` | provider | **Smart job matching**: scores every open job for this provider (category match, GPS proximity via Haversine formula, provider rating/success-rate, emergency-job bonus) and returns them ranked with human-readable match reasons. |
| GET | `/suggest-bid/:jobId` | JWT | **Bid price suggestion**: analyzes historical accepted bids in the same category (min 3 data points) to suggest a min/max/average price range; falls back to ±15–20% of the job's stated budget if no history exists. |
| GET | `/fraud-reviews` | admin | **Review fraud detection**: flags reviews posted suspiciously fast after booking creation (<120s, "velocity anomaly"), and repeated near-perfect rating patterns between the same customer/provider pair ("reciprocal rating collusion"). |
| POST | `/autocomplete` | JWT | **Job-description autocomplete**: given a partial description, the LLM (or an offline keyword-matched template bank as fallback) returns a complete description, suggested category, and suggested PKR budget. |
| POST | `/support-chatbot` | JWT | **Support chatbot**: answers user questions with live app context injected into the prompt (online provider count, open job count, the asking user's own stats) — falls back to canned FAQ answers if no LLM key is configured/available. |

---

## 5. The AI Layer (`backend/services/aiService.js`)

Kaarkun uses a **3-tier LLM fallback chain** so AI features keep working even if a provider is rate-limited or unconfigured:

1. **Groq** (`llama-3.3-70b-versatile`) — tried first, free and fast.
2. **Google Gemini** (`gemini-1.5-flash` → `gemini-2.0-flash-lite` → `gemini-2.0-flash`) — tried next if Groq fails/429s.
3. **Anthropic Claude** (`claude-3-haiku-20240307`) — final paid fallback.
4. **Rule-based offline fallback** — if no key is configured or all three fail, hand-written keyword/template logic answers instead of returning an error.

Six distinct AI-powered features run on top of this chain:
- Smart job-provider matching (scoring algorithm, not LLM-based — pure math)
- Bid price suggestions (historical-data driven, not LLM-based)
- Review fraud/anomaly detection (rule-based pattern matching, not LLM-based)
- Job description autocomplete (LLM, with offline template fallback)
- Support chatbot (LLM, with live DB stats injected as context, offline FAQ fallback)
- KYC document (CNIC) verification — uses **Gemini Vision** specifically (multimodal image + text prompt) to cross-check the uploaded ID photo against the user's claimed name
- Dispute summarization — LLM reads the full chat transcript of a job and produces a structured "who's right" summary for admin review

> **Caveat:** unlike the other five AI features, KYC verification has no fallback chain — it calls Gemini Vision directly, since Groq/Claude weren't multimodal-vision-capable at the time of writing. If the Gemini key's Google Cloud project has no billing enabled, Google returns `429 RESOURCE_EXHAUSTED` with zero free-tier quota (a project/billing-level restriction, not a bad key). When that happens, the function returns `{ confidence: null, notes: '...verify manually...' }` instead of a fabricated score, and the admin can still manually verify/reject providers — auto-verify is an assist feature, not a hard dependency for provider onboarding.

---

## 6. Real-Time Features (Socket.io)

The backend runs a Socket.io server alongside the REST API (`socketManager.js`), authenticated via a JWT handshake (`auth: { token }`) — the server verifies the token before allowing a connection and auto-joins the user to their own room.

- **Live chat** — `new_message`, `user_typing`/`user_stop_typing` events, scoped per job conversation.
- **In-app notifications** — `new_notification` pushed instantly (job posted, bid accepted, booking status changes, etc.) without polling.
- **Live provider GPS tracking** — while en route, a provider emits `location_update` (lat/lng); the customer's app listens via `provider_location` to show a live map marker; `location_stopped` ends tracking when the job starts or is cancelled. **Mobile-only by design** — the web app doesn't connect to Socket.io at all; a desktop browser tab is a poor fit for continuous background GPS reporting, so this stays a native-app feature.

---

## 7. Admin Panel (`admin/`) — Staff Console

Runs on Next.js, separate login (`admins` table, not `users`), gated by `ADMIN_SETUP_KEY` for the one-time first-account creation.

| Page | Features |
|---|---|
| `/login`, `/signup` | Admin authentication |
| `/dashboard` | Real KPI cards (total users, active jobs, bids, categories), a 12-month user-signup bar chart, and a top-5 popular-categories breakdown — all backed by live SQL aggregates (no mock data) |
| `/dashboard/users` | Customer management: view/suspend (with a reason)/unsuspend/delete; avatar with graceful fallback; **CSV export** of the visible customer list |
| `/dashboard/providers` | Provider management: view profile + uploaded CNIC/certificates, **AI-assisted auto-verify** (runs Gemini Vision KYC check), approve/reject/suspend |
| `/dashboard/jobs` | Job moderation: view details, **AI dispute summarizer** for jobs with chat history, delete |
| `/dashboard/bids` | Platform-wide bid visibility |
| `/dashboard/categories` | Add/delete service categories |

Security: JWT stored client-side, automatic logout + redirect on any `401` response, all destructive actions behind `confirm()` dialogs, toast-based (not native `alert()`) feedback throughout.

---

## 8. Customer/Provider Web App (`web/kaarkun/`) — Public Browser App

The browser-based counterpart to the mobile app — full product functionality without installing anything.

| Area | Pages | Features |
|---|---|---|
| Auth | `/login`, `/register`, `/verify-otp` | Sign-up with role selection, password-strength validation (min 8 chars, letter+number), OTP email verification |
| Shared | `/profile`, `/notifications`, `/chat`, `/support-chatbot` | Profile editing, live notification feed, real-time chat, AI support chatbot |
| Customer | `/customer/dashboard`, `/customer/jobs`, `/customer/jobs/[id]`, `/customer/post-job`, `/customer/bookings`, `/customer/submit-review` | Post jobs with photos/budget/location (with address-autocomplete `LocationInput`), review incoming bids, track bookings, **enter the provider's arrival PIN to start the job**, leave reviews |
| Provider | `/provider/dashboard`, `/provider/browse-jobs`, `/provider/bids`, `/provider/[id]` | Browse/filter open jobs, place bids, track bid status, **generate an arrival PIN for confirmed bookings**, public provider profile page |

Cross-cutting: `AuthContext` (session), `CurrencyContext`, `ThemeContext` (dark/light mode), automatic `401` logout, environment-driven image URLs (no hardcoded backend host).

---

## 9. Mobile App (`mobile/`) — Primary End-User App

Flutter app targeting Android/iOS (and Web/Desktop as secondary Flutter targets). This is the main, full-featured client.

**Auth & onboarding** (`features/auth/`): splash screen, onboarding carousel, login, signup (with file picker for avatar/CNIC/certificates), OTP verification, forgot password.

**Customer features** (`features/customer/`):
- Home screen (category browse, top providers, emergency job shortcut)
- Post a job (with photos, budget, location picker, negotiable/emergency flags, AI-assisted description autocomplete)
- My Jobs (track status, view/accept bids)
- Track Provider screen (live GPS map while a provider is en route)

`LocationTrackingService` checks GPS-enabled/permission status before starting and surfaces a clear error (SnackBar + inline warning) if location can't be shared, instead of silently doing nothing while the customer waits indefinitely. Note: tracking runs on a foreground Dart timer, not a background service — it will stop reporting if the provider backgrounds the app for an extended period (a known platform limitation, not a bug).

**Provider features** (`features/provider/`):
- Dashboard (online/offline toggle, stats)
- Browse Jobs (proximity-filtered, AI smart-matched with reasons, emergency jobs highlighted for express-accept)
- Place Bid screen (AI bid-price suggestion shown inline)
- My Bids (track bid status)
- Reviews screen (see customer feedback)

**Chat** (`features/chat/`): chat list, real-time chat room (text + images, typing indicators), support chatbot screen.

**Notifications** (`features/notifications/`): notification list + a `NotificationProvider`/`NotificationBell` widget for unread badge counts app-wide.

**Shared screens** (`shared/`):
- Job detail, customer/provider profile screens, settings
- **QR handshake screen** — provider shows a QR/PIN on arrival, customer scans/enters it to confirm and start the job
- **Map picker** — pick a job location visually (Google Maps)
- **Submit review** screen
- `navigation_screen.dart` — bottom-nav shell with role-based tabs
- Services: `BookingService`, `ReviewService`, `SyncProvider` (refreshes app state on resume/login)

**Core infrastructure** (`core/`):
- `ApiClient` (Dio) — configurable base URL via `--dart-define=API_BASE_URL`
- `TokenStorage` — JWT stored in OS keystore (`flutter_secure_storage`), not plaintext prefs
- `SocketService` — JWT-authenticated real-time layer (chat, notifications, live location)
- `app_logger.dart` — debug-only logging, stripped from release builds

---

## 10. Security Measures Implemented

- **Password hashing**: bcryptjs (cost factor 12) for both user and admin accounts.
- **JWT auth** with role checks (`authorize('customer'|'provider')`) and a separate `adminAuth` middleware that cross-checks against the dedicated `admins` table (an admin token can't be forged from a regular user token).
- **Account status enforcement**: blocked/rejected users are locked out at the middleware level (`suspendedCheck` + `authMiddleware`) on every request, not just at login.
- **Rate limiting**: login (10 attempts/15 min) and OTP verification (10/10 min) to blunt brute-force/credential-stuffing attempts.
- **File upload validation**: Multer restricts to image MIME types/extensions and a 5MB size cap.
- **CORS allow-list**: explicit origin list for production frontends, plus a safe `localhost`-only exception for local dev tooling (Flutter web's random debug port) — never opened to arbitrary remote origins.
- **Secrets hygiene**: `.env` files gitignored going forward; JWT secrets and `ADMIN_SETUP_KEY` are long random values, not defaults.
- **Mobile secure storage**: JWT tokens stored in the OS keystore via `flutter_secure_storage`, not plaintext `SharedPreferences`.
- **No stack-trace leakage**: every controller catch-block returns a generic message to the client while logging full details server-side only.
- **Socket.io auth**: real-time connections require a valid JWT handshake, preventing anonymous clients from joining notification/chat rooms.
- **Chat authorization**: sending a message requires the sender/receiver pair to actually correspond to the job's customer and a legitimate bidder/booked provider on that job — not an arbitrary user ID.
- **Race-condition-safe job claiming**: bid acceptance and emergency express-accept both use a DB transaction with an atomic conditional `UPDATE ... WHERE status='open'` to claim the job, so two concurrent accept attempts on the same job can never both succeed (verified with real concurrent-request tests).
- **Suspension-aware notifications**: suspending a user with an active booking notifies the other party immediately rather than leaving them waiting on someone who can no longer respond.

---

## 11. Complete Feature Checklist

**Account & Identity**
- [x] Role-based signup (customer / provider)
- [x] Email OTP verification
- [x] Login/JWT auth with refresh tokens
- [x] Forgot password flow
- [x] Profile editing + avatar upload
- [x] Provider KYC: CNIC + certificate upload, admin manual review, AI-assisted confidence scoring
- [x] Admin-controlled account states: pending / verified / rejected / blocked (with reason)

**Jobs & Bidding**
- [x] Post a job (title, description, category, budget, location, photos, date/time, negotiable flag)
- [x] AI-assisted job description autocomplete + budget/category suggestion
- [x] Browse/filter open jobs (proximity-aware for providers)
- [x] AI smart job-provider matching with explainable scoring
- [x] Place / accept / reject bids
- [x] AI bid price suggestion based on historical data
- [x] Emergency jobs with instant express-accept (skips bidding)
- [x] Edit/delete own job postings

**Bookings & Job Execution**
- [x] Booking creation on bid acceptance (atomic — race-condition-safe)
- [x] Arrival handshake to verify on-site presence before starting work — QR/PIN on mobile, PIN entry on web
- [x] Status lifecycle: confirmed → in_progress → awaiting_confirmation → completed
- [x] Booking cancellation with automatic job reopening + bid reset
- [x] Live GPS tracking of provider en route to job (mobile-only)
- [x] Affected-party notification when the other side of an active booking is suspended

**Communication**
- [x] Real-time chat per job (text + image attachments, typing indicators, read receipts)
- [x] In-app notifications (real-time via Socket.io)
- [x] AI support chatbot with live app-context awareness

**Reviews & Trust**
- [x] 1–5 star reviews, one per booking
- [x] Provider rating/success-rate aggregation
- [x] AI-based fake-review/fraud pattern detection (admin-only)
- [x] AI dispute summarization from chat transcripts (admin-only)

**Admin Operations**
- [x] Real-time dashboard analytics (signups trend, category popularity, platform totals)
- [x] User management (view/suspend/unsuspend/delete, with reason + email notification)
- [x] Provider verification workflow (manual + AI-assisted)
- [x] Job moderation (view/delete, AI dispute summary)
- [x] Bid oversight
- [x] Category management
- [x] CSV export of customer data

**Cross-Platform**
- [x] Same backend/API powering mobile, web app, and admin panel
- [x] Dark/light theme support (web app)
- [x] Multi-currency display support (web app `CurrencyContext`)

---

## 12. Configuration Reference

| Variable (`backend/.env`) | Purpose |
|---|---|
| `PORT` | Backend listen port (default 5000) |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing keys |
| `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY` | Token lifetimes |
| `ALLOWED_ORIGINS` | Comma-separated CORS allow-list for production frontend domains |
| `ADMIN_SETUP_KEY` | One-time secret gating admin account creation |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail credentials for OTP/notification emails (use an App Password) |
| `GROQ_API_KEY`, `GEMINI_API_KEY`, `CLAUDE_API_KEY` | LLM provider keys for the AI fallback chain |

| Variable (frontends) | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` (admin, web) | Backend REST base URL |
| `NEXT_PUBLIC_WS_URL` (web) | Backend Socket.io URL |
| `--dart-define=API_BASE_URL=` (mobile) | Overrides the default backend URL at build time |
| `MAPS_API_KEY` (`mobile/android/local.properties`) | Google Maps key, injected via Gradle `manifestPlaceholders` (gitignored, never committed) |

---

## 13. Known Deployment Considerations (not code defects)

These require real-world values once a hosting target is chosen — they are not bugs in the code itself:
- Production database credentials and CORS origins must replace the local-dev defaults in `backend/.env`.
- `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_WS_URL` in `admin/.env.local` and `web/kaarkun/.env.local` must point at the deployed backend domain (HTTPS).
- The mobile app's default `API_BASE_URL` must be overridden at build time for release APKs.
- File uploads (`backend/uploads/`) are stored on local disk — fine on a persistent VM, but requires migrating to object storage (S3-style) on ephemeral-filesystem hosts.
- The Android release build currently signs with the debug keystore — a real release keystore is required before Play Store submission.
- The Google Maps API key should be restricted in Google Cloud Console (Android package + SHA-1, Web HTTP referrer) to prevent abuse.
- The Gemini API key needs a Google Cloud project with billing enabled to get non-zero free-tier quota (account/region-level requirement, not a code or key-format issue) — until then, KYC auto-verify falls back to "verify manually" rather than erroring out.
- Real background location tracking for providers (continuing reliably while the app is backgrounded) would need a native foreground service (e.g. `flutter_background_service`) — current tracking is foreground-only.
