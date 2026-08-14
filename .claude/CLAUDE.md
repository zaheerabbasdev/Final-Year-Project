# Kaarkun — Project Reference for Claude

> **CRITICAL RULE:** Never run `git push` or any remote-push command. The user pushes code themselves from their terminal. Always stop at `git commit` and say "ready to push when you are."

---

## 1. Project Overview

**Kaarkun** is a Final Year Project (FYP) — a marketplace mobile/web app connecting home-service customers with local service providers (plumbers, electricians, cleaners, etc.) in Pakistan.

- **User**: Zaheer Abbas (`learntechdigital@gmail.com`)
- **Currency**: Pakistani Rupee (PKR). Backend stores all monetary values in PKR. Web/app display values via `convertFromPkr()` / `convertToPkr()` helpers. Always use `Math.round()` when converting to PKR to avoid decimals.
- **Language**: English UI, Pakistan-centric (phone numbers, location data)

---

## 2. Architecture & Tech Stack

```
Mobile (Flutter)  ──┐
Web (Next.js)     ──┤──► AWS ALB ──► ECS Fargate ──► Node.js/Express ──► MySQL (RDS)
Admin (Next.js)   ──┘                                      │
                                                     AWS S3 (uploads)
                                                     AWS Secrets Manager
```

| Layer         | Tech                        | Location              |
|---------------|-----------------------------|-----------------------|
| Mobile App    | Flutter (Dart)              | `e:/fyp/mobile/`      |
| Customer Web  | Next.js 15 (App Router)     | `e:/fyp/web/kaarkun/` |
| Admin Panel   | Next.js (App Router)        | `e:/fyp/admin/`       |
| Backend API   | Node.js + Express           | `e:/fyp/backend/`     |
| Database      | MySQL (AWS RDS)             | schema: `backend/schema.sql` |
| File Storage  | AWS S3                      | bucket: `academy-dev-uploads` |
| Realtime      | Socket.IO                   | `backend/socketManager.js` |
| AI Features   | Groq, Gemini, Anthropic     | `backend/services/aiService.js` |
| IaC           | Terraform                   | `e:/fyp/terraform/`   |
| CI/CD         | GitHub Actions              | `.github/workflows/deploy-aws.yml` |

---

## 3. Repository Structure

```
e:/fyp/
├── .claude/
│   └── CLAUDE.md              ← this file
├── .github/
│   └── workflows/
│       └── deploy-aws.yml     ← builds 3 Docker images, pushes to ECR, updates ECS
├── backend/
│   ├── app.js                 ← entry point; Express setup, routes, DB init, mailer init
│   ├── schema.sql             ← full MySQL schema (run on startup via initializeDatabase())
│   ├── config/db.js           ← mysql2/promise pool
│   ├── controllers/           ← business logic
│   ├── routes/                ← Express routers
│   ├── models/                ← DB query helpers
│   ├── middleware/
│   │   ├── auth.js            ← JWT authMiddleware + authorize(role)
│   │   ├── adminAuth.js       ← admin-only JWT check
│   │   ├── upload.js          ← multer → S3 (multer-s3)
│   │   ├── rateLimiter.js     ← loginLimiter, otpLimiter
│   │   └── suspendedCheck.js  ← blocks blocked/rejected users
│   ├── services/
│   │   ├── aiService.js       ← Groq/Gemini/Anthropic integrations
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── mailer.js          ← Nodemailer (Gmail); self-healing transporter
│   │   └── s3.js              ← AWS S3 helpers
│   └── socketManager.js       ← Socket.IO: rooms, real-time messages/notifications
├── web/kaarkun/
│   ├── app/                   ← Next.js App Router pages
│   │   ├── page.tsx           ← landing / redirect to login
│   │   ├── login/             ← customer + provider login
│   │   ├── register/          ← customer + provider registration
│   │   ├── verify-otp/        ← OTP verification (with Resend Code, 60s cooldown)
│   │   ├── forgot-password/   ← send reset code
│   │   ├── chat/              ← real-time chat list
│   │   ├── notifications/     ← notification list
│   │   ├── profile/           ← user profile
│   │   ├── support-chatbot/   ← AI chatbot (Groq-powered)
│   │   ├── customer/
│   │   │   ├── dashboard/     ← customer home
│   │   │   ├── post-job/      ← post new job (AI autocomplete, file upload)
│   │   │   ├── jobs/          ← customer's posted jobs
│   │   │   ├── jobs/[id]/     ← job details + bids (renders job images from S3)
│   │   │   ├── bookings/      ← active bookings
│   │   │   └── submit-review/ ← leave a review
│   │   └── provider/
│   │       ├── dashboard/     ← provider home
│   │       ├── browse-jobs/   ← AI-matched jobs + bid modal
│   │       ├── bids/          ← provider's submitted bids
│   │       ├── reviews/       ← reviews received
│   │       └── [id]/          ← public provider profile
│   ├── app/utils/api.ts       ← axios instance + getFileUrl()
│   └── next.config.ts         ← image remote patterns (ALB hostname)
├── admin/
│   └── src/app/
│       ├── login/             ← admin login
│       ├── signup/            ← admin registration
│       └── dashboard/
│           ├── page.tsx       ← admin overview
│           ├── users/         ← manage customers
│           ├── providers/     ← verify/reject providers
│           ├── jobs/          ← view all jobs
│           ├── bids/          ← view all bids
│           └── categories/    ← manage service categories
├── mobile/lib/
│   ├── core/
│   │   ├── api_client.dart    ← Dio HTTP client; baseUrl = ALB DNS /api
│   │   └── utils/token_storage.dart
│   └── features/
│       ├── auth/              ← login, signup, OTP verify, forgot/reset password
│       ├── chat/              ← real-time chat UI
│       ├── customer/          ← customer-role screens
│       ├── provider/          ← provider-role screens
│       └── shared/            ← widgets, theme, common screens
└── terraform/
    ├── ecs.tf                 ← ECS cluster, task definitions, services
    ├── networking.tf          ← VPC, subnets, ALB, security groups
    ├── outputs.tf             ← ALB DNS output
    ├── variables.tf           ← variable declarations
    ├── terraform.tfvars       ← required vars (committed)
    ├── secrets.tfvars         ← sensitive vars (GITIGNORED — do not commit)
    └── secrets.tfvars.example ← template for secrets.tfvars
```

---

## 4. Database Schema (MySQL)

**Database name**: `kaarkun_db` (local) / set via `DB_NAME` env var

| Table               | Key Columns & Notes |
|---------------------|---------------------|
| `categories`        | id, name, icon — seeded: Plumber, Electrician, Carpenter, Painter, Cleaner, Gardener, AC Repair, Appliance Repair |
| `admins`            | id, username, email, password_hash, full_name — default: `zaheer_admin / Admin@1234` |
| `users`             | id, full_name, email, phone, password_hash, role(customer/provider/admin), avatar, location, lat/lng, **status(pending/verified/rejected/blocked)**, otp_code, otp_expiry |
| `refresh_tokens`    | id, user_id, token, expires_at |
| `provider_profiles` | user_id(PK), bio, experience_years, skills(JSON), availability, rating, total_jobs, success_rate, category_id, cnic_url, certificates_url, is_online, ai_confidence_score, ai_verification_notes, reviewed_by |
| `jobs`              | id, customer_id, title, description, category_id, budget(DECIMAL PKR), location, preferred_date/time, images(JSON), status(open/active/completed/cancelled), lat/lng, is_negotiable, is_emergency |
| `bids`              | id, job_id, provider_id, amount(DECIMAL PKR), estimated_time, cover_letter, status(pending/accepted/rejected) |
| `bookings`          | id, job_id, bid_id, customer_id, provider_id, status(confirmed/in_progress/awaiting_confirmation/completed/cancelled), verification_token |
| `reviews`           | id, job_id, booking_id, customer_id, provider_id, rating(1-5), comment — UNIQUE on booking_id |
| `messages`          | id, job_id, sender_id, receiver_id, content, image_url, is_read |
| `notifications`     | id, user_id, title, message, type, is_read |

**Schema runs on server startup** via `initializeDatabase()` in `app.js` — uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run.

---

## 5. Backend API Routes

Base path: `/api`

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register customer or provider; customers get OTP email |
| POST | `/login` | — | Login; returns `accessToken` + `refreshToken` |
| POST | `/verify-otp` | — | Verify 6-digit OTP; sets user status=verified |
| POST | `/resend-otp` | — | Resend OTP to email (rate-limited) |
| POST | `/forgot-password` | — | Send password reset OTP |
| POST | `/reset-password` | — | Reset password with OTP token |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | ✓ | Get own profile |
| PUT | `/me` | ✓ | Update profile |
| DELETE | `/me` | ✓ | Delete account |
| PATCH | `/me/online-status` | ✓ | Toggle online status |
| POST | `/me/avatar` | ✓ | Upload avatar to S3 |
| GET | `/providers/top` | — | Top-rated providers |
| GET | `/providers` | — | All providers (filterable) |
| GET | `/providers/:id` | — | Provider public profile |
| GET | `/:id` | — | Any user by ID |

### Categories — `/api/categories`
Standard CRUD; admin-protected for write operations.

### Jobs — `/api/jobs`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | All open jobs |
| POST | `/` | customer | Create job (up to 6 images) |
| GET | `/my/jobs` | ✓ | Jobs posted by current user |
| POST | `/:id/express-accept` | ✓ | Accept job directly |
| GET | `/:id` | — | Job details |
| PUT | `/:id` | customer | Update job |
| DELETE | `/:id` | customer | Delete job |

### Bids — `/api/bids`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | provider | Place bid on a job |
| GET | `/job/:jobId` | ✓ | Bids for a specific job |
| GET | `/my/bids` | provider | Provider's own bids |
| PUT | `/:id/accept` | customer | Accept a bid |

### Bookings — `/api/bookings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/my` | ✓ | My bookings |
| GET | `/job/:jobId` | ✓ | Booking for a specific job |
| PUT | `/job/:jobId/status` | ✓ | Update status via job ID |
| PUT | `/:id/status` | ✓ | Update booking status |
| POST | `/:id/handshake/generate` | ✓ | Generate QR handshake token |
| POST | `/:id/handshake/verify` | ✓ | Verify QR handshake token |
| PUT | `/:id/cancel` | ✓ | Cancel booking |

### Messages — `/api/messages` (all require auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/list` | Chat list (conversations) |
| GET | `/:jobId/:otherUserId` | Messages in a thread |
| POST | `/send` | Send message (optional image upload) |
| PUT | `/read/:jobId/:senderId` | Mark messages as read |

### Reviews — `/api/reviews`
POST to create, GET to read (by provider/job).

### Notifications — `/api/notifications`
GET list, PATCH mark-read, DELETE clear.

### AI — `/api/ai`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matching-jobs` | provider | AI-matched job recommendations |
| GET | `/suggest-bid/:jobId` | ✓ | AI bid price suggestion |
| GET | `/fraud-reviews` | admin | Fraud detection logs |
| POST | `/autocomplete` | ✓ | AI autocomplete for job posting (title/desc → category + budget) |
| POST | `/support-chatbot` | ✓ | AI support chatbot |

### Geocode — `/api/geocode`
Address to lat/lng conversion.

### Admin — `/api/admin`
Admin-only panel endpoints (requires `adminAuth` middleware).

---

## 6. Environment Variables

### Backend (`.env` for local, AWS Secrets Manager for production)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kaarkun_db
JWT_SECRET=<long random hex>
JWT_REFRESH_SECRET=<long random hex>
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
AWS_REGION=ap-south-1
AWS_S3_BUCKET=academy-dev-uploads
EMAIL_USER=zabbas092002@gmail.com
EMAIL_PASS=<gmail app password>
GROQ_API_KEY=<groq key>
GEMINI_API_KEY=<gemini key>
CLAUDE_API_KEY=<anthropic key>
```

> **Production**: `EMAIL_USER`, `EMAIL_PASS`, `JWT_SECRET`, `DB_PASSWORD` are injected from **AWS Secrets Manager** via the ECS task definition's `secrets:` array. Never hardcode them in the workflow.

### Frontend Build Args (set in `deploy-aws.yml`)
```
NEXT_PUBLIC_API_URL=http://academy-dev-alb-1664407925.ap-south-1.elb.amazonaws.com/api
NEXT_PUBLIC_WS_URL=http://academy-dev-alb-1664407925.ap-south-1.elb.amazonaws.com
```

### Flutter (compile-time define)
```
API_BASE_URL=http://academy-dev-alb-1664407925.ap-south-1.elb.amazonaws.com/api
```
Set via `flutter run --dart-define=API_BASE_URL=...` or hardcoded default in `mobile/lib/core/api_client.dart`.

---

## 7. AWS Infrastructure (Terraform)

**Region**: `ap-south-1` (Mumbai)  
**Terraform workspace**: `e:/fyp/terraform/`

### Required files to run Terraform
- `terraform.tfvars` (committed):
  ```hcl
  aws_region   = "ap-south-1"
  project_name = "academy"
  environment  = "dev"
  vpc_cidr     = "10.0.0.0/16"
  ```
- `secrets.tfvars` (**GITIGNORED** — never commit):
  ```hcl
  email_user = "zabbas092002@gmail.com"
  email_pass = "<gmail app password>"
  ```

### Apply command
```bash
terraform apply -var-file=terraform.tfvars -var-file=secrets.tfvars -auto-approve
```

### ECS Services
| Service | ECR Repo | ECS Service Name |
|---------|----------|-----------------|
| Backend | `academy-dev-backend` | `academy-dev-backend` |
| Frontend | `academy-dev-frontend` | `academy-dev-frontend` |
| Admin | `academy-dev-admin` | `academy-dev-admin` |
| Cluster | — | `academy-dev-cluster` |

### ALB
- **Current DNS**: `academy-dev-alb-1664407925.ap-south-1.elb.amazonaws.com`
- ⚠️ When Terraform destroys and recreates the ALB, the suffix number changes. After any `terraform apply` that recreates the ALB, update these 3 places:
  1. `web/kaarkun/next.config.ts` → `remotePatterns hostname`
  2. `.github/workflows/deploy-aws.yml` → both `NEXT_PUBLIC_API_URL` build args
  3. `mobile/lib/core/api_client.dart` → `defaultValue` in `String.fromEnvironment`

### S3 Bucket
- Name: `academy-dev-uploads`
- Used for: avatars, job images, chat image attachments
- Accessed via signed URLs or public URLs depending on bucket policy

---

## 8. CI/CD Pipeline

File: `.github/workflows/deploy-aws.yml`  
Triggered: push to `master` branch

**Steps:**
1. Configure AWS credentials (from GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Login to ECR
3. Build & push backend Docker image (no build args — env vars from Secrets Manager at runtime)
4. Build & push frontend Docker image (with `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_WS_URL`)
5. Build & push admin Docker image (with `NEXT_PUBLIC_API_URL`)
6. Register new backend task definition (injects `AWS_S3_BUCKET` + `AWS_REGION` env vars; preserves Secrets Manager secrets)
7. Update all 3 ECS services with new images

---

## 9. Authentication Flow

### Customer Registration + OTP
1. POST `/api/auth/register` with `role=customer`
2. Backend creates user with `status=pending`, generates 6-digit OTP, stores in `users.otp_code`
3. Sends OTP via Gmail (Nodemailer)
4. Response includes `{ requiresOTP: true, emailSent: true/false }`
5. Frontend redirects to `/verify-otp`
6. POST `/api/auth/verify-otp` with `{ email, otp }`
7. Backend sets `status=verified`, clears OTP fields
8. User can now log in

### Provider Registration
- Same as customer but no OTP required at registration
- Provider status stays `pending` until admin verifies CNIC/certificates
- Admin panel: Dashboard → Providers → Verify/Reject

### JWT Flow
- Login returns `accessToken` (7d) + `refreshToken` (7d)
- All protected routes require `Authorization: Bearer <accessToken>`
- Mobile uses Dio interceptor to attach token from `TokenStorage`
- Web uses axios interceptor in `app/utils/api.ts`

### Admin Auth
- Separate `admins` table (not `users`)
- `adminAuth` middleware checks admin JWT
- Default admin: `zaheer_admin / Admin@1234 / learntechdigital@gmail.com`

---

## 10. Key Implementation Details

### Currency Conversion
- Backend stores PKR amounts (e.g., `budget = 5000.00`)
- Web/mobile display values in local currency via `convertFromPkr()` helper
- When sending amounts to backend: always `Math.round(convertToPkr(Number(value)))` to avoid decimals
- When displaying: `Math.round(convertFromPkr(amount))` for clean integers

### AI Autocomplete (Post Job)
- File: `web/kaarkun/app/customer/post-job/page.tsx`
- POST `/api/ai/autocomplete` with `{ title, description }`
- Returns `{ category, suggestedBudget }`
- Category matching uses fuzzy logic: exact match → contains in either direction (case-insensitive)
- Budget: `String(Math.round(convertFromPkr(res.data.suggestedBudget)))`

### Mailer (Self-Healing)
- File: `backend/utils/mailer.js`
- Uses Gmail SMTP with App Password
- **Pattern**: Lazy `_transporter` creation; rebuilt if `EMAIL_USER` env var changes; reset after any send failure
- Three functions: `sendOTP(email, otp)`, `sendPasswordReset(email, otp)`, `sendWelcome(email, name)` — all return `true/false`
- `checkConfig()` validates env vars before attempting to send
- In production, `EMAIL_USER`/`EMAIL_PASS` come from AWS Secrets Manager injected as env vars

### Job Images
- Stored as JSON array in `jobs.images` column
- Displayed in `web/kaarkun/app/customer/jobs/[id]/page.tsx`
- URL construction: `getFileUrl(imagePath)` from `app/utils/api.ts`
- Supports JSON-encoded array, comma-separated string, or plain array

### Real-Time (Socket.IO)
- File: `backend/socketManager.js`
- Rooms: per-user (`user_${userId}`) and per-job-thread (`job_${jobId}_${user1}_${user2}`)
- Events: `new_message`, `new_notification`, `typing`, `read_receipt`, `user_online`

### File Uploads
- Handled by `multer-s3` middleware in `backend/middleware/upload.js`
- Avatar: single file → `avatars/` prefix in S3
- Job images: up to 6 files → `jobs/` prefix
- Chat images: single file → `messages/` prefix

---

## 11. Local Development

### Backend
```bash
cd e:/fyp/backend
npm install
# Ensure MySQL is running with kaarkun_db
npm run dev   # or: node app.js
# Runs on port 5000
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
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api  # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api  # iOS sim
```

---

## 12. Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| `ServiceNotFoundException` in ECS | Cluster/services not created or `$ECS_CLUSTER` shell var empty | Use literal names: `academy-dev-cluster`, `academy-dev-backend` |
| `ERR_NAME_NOT_RESOLVED` on ALB | ALB DNS changed after Terraform recreated infra | Update 3 files (see Section 7, ALB note) |
| OTP email not sending | `EMAIL_USER`/`EMAIL_PASS` missing in env | Check Secrets Manager; verify secrets.tfvars was used in `terraform apply` |
| Mailer stuck after auth failure | Old singleton pattern (now fixed) | Self-healing transporter resets on failure |
| `Invalid Date` in chat | `new Date(null).toLocaleDateString()` | Use `formatDate()` helper that returns `''` for null/bad dates |
| Bid amount has decimals | `.toFixed()` instead of `Math.round()` | Always `Math.round(convertFromPkr(amount))` |
| AI category not matching | Exact string mismatch | Use `findCategory()` fuzzy matcher in post-job page |
| `terraform apply` fails — missing var | No `terraform.tfvars` | File exists at `terraform/terraform.tfvars` with 4 required vars |

---

## 13. Important File Locations Quick Reference

| What | Where |
|------|-------|
| Backend entry | `backend/app.js` |
| DB schema | `backend/schema.sql` |
| Mailer (self-healing) | `backend/utils/mailer.js` |
| Auth controller | `backend/controllers/authController.js` |
| AI controller | `backend/controllers/aiController.js` |
| Socket.IO manager | `backend/socketManager.js` |
| S3 upload middleware | `backend/middleware/upload.js` |
| Web API client | `web/kaarkun/app/utils/api.ts` |
| Web next.config | `web/kaarkun/next.config.ts` |
| Flutter API client | `mobile/lib/core/api_client.dart` |
| Flutter token storage | `mobile/lib/core/utils/token_storage.dart` |
| CI/CD workflow | `.github/workflows/deploy-aws.yml` |
| Terraform main | `terraform/ecs.tf` + `networking.tf` |
| Terraform required vars | `terraform/terraform.tfvars` |
| Terraform secrets (gitignored) | `terraform/secrets.tfvars` |
