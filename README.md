# TechFest Hub — Full-Stack College Technical Event Registration Platform

**TechFest Hub** is a collegiate event discovery, registration, team formation, digital ticket generation, and credential management platform built with modern web technologies.

## 🚀 Key Features

- **Public Event Discovery**: Discover college hackathons, coding contests, workshops, and robotics arenas with real-time capacity meters, countdowns, and filters.
- **Smart Registration Engine**:
  - Individual one-click registration with profile confirmation.
  - Team formation with unique join codes (e.g., `TEAM-BYTE-88`) and invite-by-email workflow.
  - Atomic database transactions to prevent overbooking and race conditions.
  - Automatic Waitlist Promotion: If an attendee cancels, the top waitlisted student is automatically promoted and issued an active digital ticket!
- **Digital Tickets & QR Gate Check-in**:
  - High-resolution SVG/Canvas QR codes encoded with random, unguessable cryptographic tokens.
  - Printable attendee passes with college crest and venue details.
  - Organizer Check-in Terminal with camera scanner and manual fallback.
  - Duplicate check-in prevention with real-time server timestamping.
- **Official Verified Certificates**:
  - Collegiate certificates issued only to attendees with confirmed attendance.
  - Unique certificate serial numbers (e.g. `CERT-TECHFEST-2026-9041`).
  - Public verification page (`/verify-certificate?id=...`) for employers and faculty.
- **Role-Based Access Control (RBAC)**:
  - `STUDENT`: Default role for all registrations. Can browse, register, form teams, view tickets, and download certificates.
  - `ORGANIZER`: Manage events, view participants, export CSVs, check in attendees, and award verified certificates.
  - `ADMIN`: Platform analytics (Recharts), user permission governance, review and approve event submissions, and audit logs.
- **Security by Design**:
  - Secure bcrypt password hashing.
  - Secure HTTP-only session cookies and Authorization Bearer support.
  - In-memory rate limiting on sensitive authentication endpoints.
  - Comprehensive immutable Audit Logs for administrative actions.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Recharts, QRCode, Lucide React, Canvas Confetti.
- **Backend**: Node.js & Express with TypeScript, RESTful architecture.
- **Database**: Prisma ORM with relational schema, foreign keys, unique constraints, and atomic transactions. Supports SQLite in development and PostgreSQL in production.

---

## 🔑 Demo Accounts & Pre-Seeded Testing Credentials

The database includes pre-seeded demo accounts with preset roles. You can sign in using the **1-Click Demo Accounts dropdown** in the navigation bar or use the following credentials:

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Student** | Alex Rivera | `alex.student@college.edu` | `Password123!` |
| **Organizer** | Sarah Chen | `sarah.organizer@college.edu` | `Password123!` |
| **Administrator** | Dr. Eleanor Vance | `admin@college.edu` | `Password123!` |

---

## 📋 Project Structure

```
├── package.json               # Full-stack dependencies and scripts
├── server.ts                  # Express server mounting APIs and Vite middleware
├── prisma/
│   ├── schema.prisma          # Prisma schema with relational models and constraints
│   ├── schema.postgresql.prisma # PostgreSQL production schema
│   └── seed.ts                # Database seeding script with realistic events & tickets
├── src/
│   ├── components/            # Reusable components
│   │   ├── Navbar.tsx         # Responsive header, notification center, demo switcher
│   │   ├── Footer.tsx         # Collegiate links, terms, contact
│   │   ├── EventCard.tsx      # Event card with live capacity progress bar
│   │   ├── DigitalTicketCard.tsx # Printable ticket with QR code
│   │   ├── CertificateCard.tsx   # Verified collegiate certificate
│   │   └── StatusBadge.tsx    # Event and registration status pills
│   ├── context/
│   │   ├── AuthContext.tsx    # User authentication and demo switcher context
│   │   └── ToastContext.tsx   # Toast notification provider
│   ├── lib/
│   │   └── api.ts             # Centralized fetch API client
│   ├── pages/
│   │   ├── LandingPage.tsx    # "Discover. Participate. Innovate." hero, live stats, FAQs
│   │   ├── EventsPage.tsx     # Discovery with search, category pills, format filters
│   │   ├── EventDetailsPage.tsx # Event rules, capacity, and registration modal
│   │   ├── LoginPage.tsx      # Sign in with 1-click presets
│   │   ├── RegisterPage.tsx   # Student account registration
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── PublicCertificateVerifyPage.tsx # Public certificate verification
│   │   ├── student/           # Student portal pages (Dashboard, Teams, Tickets, etc.)
│   │   ├── organizer/         # Organizer hub (Events, Participants, QR Check-in)
│   │   └── admin/             # Admin console (Analytics, Users, Approvals, Audit)
│   └── server/
│       ├── db.ts              # Prisma client singleton
│       ├── auth.ts            # Password hashing, JWT, RBAC middlewares, audit logging
│       └── routes/            # REST API route controllers
│           ├── auth.routes.ts
│           ├── event.routes.ts
│           ├── registration.routes.ts
│           ├── team.routes.ts
│           ├── attendance.routes.ts
│           ├── certificate.routes.ts
│           ├── notification.routes.ts
│           ├── admin.routes.ts
│           └── stats.routes.ts
└── test/
    └── api.test.ts            # Automated test suite
```

---

## 💻 Commands & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Run Seed Data
```bash
npx prisma db push
npm run seed
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🚀 Deploying to Vercel

TechFest Hub is pre-configured for seamless zero-config deployment to **Vercel**:

### Framework Preset:
- **Framework Preset**: `Vite`
- **Build Command**: `node scripts/vercel-build.js` (or `npm run build`)
- **Output Directory**: `dist`
- **Serverless API Routes**: `/api` (configured automatically via `vercel.json` and `/api/index.ts`)

### Steps to Deploy:
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, set:
   - `JWT_SECRET`: A strong secret string (e.g. `openssl rand -hex 32`).
   - `DATABASE_URL`: Your PostgreSQL connection string (from **Vercel Postgres**, **Neon**, **Supabase**, or **Cloud SQL**).
     *Note: When `DATABASE_URL` starts with `postgres://` or `postgresql://`, the build script automatically applies `prisma/schema.postgresql.prisma` and runs `prisma generate`!*
4. Click **Deploy**. Vercel will build the Vite single-page application and deploy the Express API routes as high-performance Serverless Functions!


## 🔌 API Documentation Summary

### Authentication
- `POST /api/auth/register` — Register student account
- `POST /api/auth/login` — Sign in and receive token
- `POST /api/auth/logout` — Clear session
- `GET /api/auth/me` — Retrieve authenticated user profile
- `POST /api/auth/forgot-password` — Generate password reset token
- `POST /api/auth/reset-password` — Update password with token

### Events
- `GET /api/events` — Filter events by search, category, format, mode, and date
- `GET /api/events/:id` — Event details with user registration status
- `POST /api/events` — Create new event (Organizer/Admin)
- `PATCH /api/events/:id` — Update event details (Organizer/Admin)
- `DELETE /api/events/:id` — Cancel or delete event
- `POST /api/events/:id/submit-for-approval` — Submit draft for admin review
- `POST /api/events/:id/approve` — Admin approve/reject event

### Registrations & Waitlist
- `POST /api/events/:id/register` — Register for event (solo or team); automatically waitlists if full
- `GET /api/registrations/me` — Current user's registered events and tickets
- `GET /api/events/:id/registrations` — Organizer view of participants; supports `?export=csv`
- `PATCH /api/registrations/item/:id/status` — Manual status update / promotion
- `POST /api/registrations/item/:id/cancel` — Cancel registration; automatically promotes next waitlisted attendee

### Teams
- `POST /api/teams` — Create team with unique code
- `POST /api/teams/join` — Join team using code
- `GET /api/teams/me` — User's teams and pending invitations
- `POST /api/teams/:id/invitations` — Invite teammate by email
- `POST /api/teams/invitations/:id/respond` — Accept/decline invite

### Attendance & Digital Tickets
- `POST /api/events/:id/check-in` — Validate ticket QR token or reference, record attendance timestamp, prevent duplicates
- `GET /api/events/:id/attendance` — Live attendance rate and attendee logs

### Certificates & Notifications
- `GET /api/certificates/me` — User's earned certificates
- `GET /api/certificates/verify/:number` — Public certificate verification
- `POST /api/events/:id/certificates` — Organizer awards certificates to verified attendees
- `GET /api/notifications` — Notification center
- `PATCH /api/notifications/:id/read` — Mark read

### Administration
- `GET /api/admin/analytics` — Platform metrics, 7-day velocity chart, category breakdown
- `GET /api/admin/users` — User management
- `PATCH /api/admin/users/:id/role` — Update role permissions
- `PATCH /api/admin/users/:id/suspend` — Account suspension toggle
- `GET /api/admin/audit-logs` — Audit trail
