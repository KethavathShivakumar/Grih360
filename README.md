# Grih360 — Unified Home Platform (Tier-2 & Tier-3 India)

Grih360 is a production-oriented unified home ecosystem designed for Tier-2 and Tier-3 India, initially focused on Telangana and Andhra Pradesh. It unifies Property Discovery, Rental Applications, Background Verification, Lease Lifecycle, Rent Tracking, Home Services, Professional Networks, and Admin Operations into a single cohesive MEAN-stack application.

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
Grih360/
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

