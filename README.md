# Nivas360 — Unified Home Platform (Tier-2 & Tier-3 India)

Nivas360 is a production-oriented unified home ecosystem designed for Tier-2 and Tier-3 India, initially focused on Telangana and Andhra Pradesh. It unifies Property Discovery, Rental Applications, Background Verification, Lease Lifecycle, Rent Tracking, Home Services, Professional Networks, and Admin Operations into a single cohesive MEAN-stack application.

---

## Technical Stack & Architecture

- **Frontend**: Angular 19+ (Standalone Components, Reactive Forms, RxJS, Deccan Civic Bento Visual Language)
- **Backend**: Node.js & Express.js (TypeScript, RESTful Architecture, Layered Controller-Service-Model Pattern)
- **Database**: MongoDB & Mongoose (Strict Schemas, Indexed Queries, Projections, Resilient In-Memory Fallback Store)
- **Security**: Helmet Headers, Express Rate Limiting, CORS Protection, JWT Tokens (Access/Refresh), Password Hashing (Bcrypt), IDOR Server-side Enforcement, Audit Trail
- **Testing**: E2E Integration Suite (`test-api.ts`), 68/68 Automated API & Security Tests Passing

---

## Directory Structure

```text
Nivas360/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment variables & DB connection
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth, Role, Security, Validation, Logging, Errors
│   │   ├── models/         # Mongoose schemas & in-memory fallbacks
│   │   ├── routes/         # Express router endpoints
│   │   ├── scripts/        # test-api.ts E2E test runner
│   │   ├── services/       # Domain business logic & state machines
│   │   ├── types/          # TypeScript interface definitions
│   │   ├── utils/          # JWT, Password hashing, API response helpers
│   │   └── validators/     # Input validation rules
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Guards, Interceptors, Services, Models
│   │   │   ├── features/   # Tenant, Owner, Professional, Admin workspaces
│   │   │   ├── layouts/    # Workspace layouts (Tenant, Owner, Pro, Admin)
│   │   │   └── shared/     # Bento UI components, Stitch banners, error states
│   ├── package.json
│   └── tsconfig.json
├── API_DOCUMENTATION.md    # REST API Specification
└── DESIGN_TRACKING.md     # Stitch Design & Page Status Matrix
```

---

## Environment Configuration

Copy `.env.example` to `.env` in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nivas360
JWT_ACCESS_SECRET=your_strong_jwt_access_secret_here
JWT_REFRESH_SECRET=your_strong_jwt_refresh_secret_here
FRONTEND_URL=http://localhost:4200
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NODE_ENV=development
```

> **Security Note**: Never commit `.env` or hardcoded credentials to Git history.

---

## Quick Start Guide

### 1. Backend Setup & Test Suite
```bash
cd backend
npm install
npm run build      # Verifies TypeScript compilation
npm test           # Runs 68 E2E backend integration & security tests
npm run dev        # Starts Express API server on http://localhost:5000
```

### 2. Frontend Setup & Build
```bash
cd frontend
npm install
npm run build      # Compiles Angular production bundle into dist/frontend
npm start          # Starts Angular dev server on http://localhost:4200
```

---

## Production Security & Deployment Readiness

1. **Role Authorization & IDOR Protection**: Server-side role validation (`TENANT`, `OWNER`, `PROFESSIONAL`, `ADMIN`) is strictly enforced on all resource endpoints. Direct URL or API access to unauthorized user data returns `403 Forbidden` / `401 Unauthorized`.
2. **Identity Verification Privacy**: Background verification documents are stored securely and never exposed via public URLs. Only status badges are returned to owners, while document review is restricted to authorized admins.
3. **Database Backup Strategy**:
   - Production MongoDB instances should be configured with Replica Sets and automated daily snapshots (`mongodump` or cloud backups).
   - Data retention recommendation: 30 days minimum for audit trail logs.
4. **Health & Readiness Endpoints**:
   - `GET /api/v1/health` for load balancers.
   - `GET /api/v1/admin/system` for admin operations monitoring.
5. **Support System**: Integrated support workflows and help center across workspaces.

---

## Phase 10 — Production Deployment & Final Validation Status

- **Angular Production Build**: ✅ PASSED (`ng build --configuration production`) -> Output in `frontend/dist/frontend`
- **Backend Production Build**: ✅ PASSED (`tsc`) -> Output in `backend/dist`
- **Automated E2E Integration Suite**: ✅ PASSED (68/68 tests passing, 0 failures)
- **Environment Configuration**: ✅ PASSED (`environment.prod.ts` configured with dynamic `/api/v1` API service)
- **Deployment Documentation**: Complete deployment guide available in [`DEPLOYMENT.md`](file:///d:/Nivas360%20new/DEPLOYMENT.md)

---

## Pending External Integrations (Service Abstractions)

The following external service integrations use clean provider abstractions and render explicit pending states (no fake provider responses):
- **OTP Gateway**: Provider abstraction prepared for SMS gateways (e.g., MSG91 / Twilio).
- **Government Aadhaar Verification**: Provider abstraction prepared for authorized KYC providers.
- **Payment Gateway**: Payment tracking model ready for Razorpay / Cashfree API integration.
- **Legal E-Sign**: Agreement model prepared for eMudhra / Digio integration.

