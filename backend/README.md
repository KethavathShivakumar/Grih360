# Nivas360 — Backend REST API Specification & Architecture

Production-quality backend REST API server built for **Nivas360** using Node.js, Express.js, TypeScript, and MongoDB/Mongoose.

---

## 1. Quick Start & Commands

```bash
# Install dependencies
npm install

# Run in development mode with live reload
npm run dev

# Build TypeScript production bundle
npm run build

# Start production server
npm start

# Run API Integration Test Suite
npm test
```

---

## 2. Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nivas360
JWT_ACCESS_SECRET=nivas360_dev_jwt_access_secret_key_2026
JWT_REFRESH_SECRET=nivas360_dev_jwt_refresh_secret_key_2026
FRONTEND_URL=http://localhost:4200
GOOGLE_MAPS_API_KEY=AIzaSyDSkelUvGii5waZT4Edk2n8wsAg7tlEI54
NODE_ENV=development
```

---

## 3. Architecture & Security Boundaries

- **Prefix**: `/api/v1`
- **Password Security**: Passwords hashed using `bcryptjs` (salt rounds: 10). `passwordHash` is excluded from queries (`select: false`) and stripped via `toJSON()`.
- **JWT Session Tokens**: Short-lived Access Tokens (15 min) + Refresh Tokens (7 days).
- **Server-Side Authorization**: `authorizeRoles('OWNER', 'ADMIN')` middleware protects sensitive write operations.
- **Server-Side Ownership Enforcement**: `PATCH /api/v1/properties/:id` and `DELETE /api/v1/properties/:id` verify that `property.ownerId === req.user.userId` before modifying records.
- **Role Control**: Public registration via `POST /api/v1/auth/register` permits `TENANT`, `OWNER`, `PROFESSIONAL`. Public registration as `ADMIN` is strictly forbidden.

---

## 4. API Endpoints Reference

### Health Check
- `GET /api/v1/health` — System status & MongoDB connection state.

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register User (`name`, `email`, `phone`, `password`, `role`).
- `POST /api/v1/auth/login` — Authenticate User (`identifier`, `password`). Returns JWT access and refresh tokens.
- `GET /api/v1/auth/me` — Fetch authenticated user profile (`Bearer <token>`).
- `POST /api/v1/auth/logout` — Logout session.
- `POST /api/v1/auth/refresh` — Refresh access token.

### User Profiles (`/api/v1/users`)
- `GET /api/v1/users/profile` — Fetch user account profile.
- `PUT /api/v1/users/profile` — Update user account profile.

### Properties (`/api/v1/properties`)
- `GET /api/v1/properties` — Search/list properties (`city`, `locality`, `propertyType`, `bhk`, `minRent`, `maxRent`, `furnishing`).
- `GET /api/v1/properties/my/listings` — List properties owned by authenticated Owner/Admin.
- `GET /api/v1/properties/my/saved` — List saved properties for authenticated Tenant.
- `GET /api/v1/properties/:id` — Get single property details.
- `POST /api/v1/properties` — Create property listing (`Owner`, `Admin`).
- `PATCH /api/v1/properties/:id` — Update property listing (Enforces `ownerId` server-side).
- `DELETE /api/v1/properties/:id` — Delete property listing (Enforces `ownerId` server-side).
- `POST /api/v1/properties/:id/save` — Save property to favorites (`Tenant`).
- `DELETE /api/v1/properties/:id/save` — Remove property from saved list (`Tenant`).

### Rental Applications (`/api/v1/applications`)
- `POST /api/v1/applications` — Submit rental application (`Tenant`).
- `GET /api/v1/applications` — List applications (Tenant: submitted apps; Owner: received apps).
- `PATCH /api/v1/applications/:id/status` — Review application status (`Owner`, `Admin`).

### Home Maintenance & Services (`/api/v1/services`)
- `GET /api/v1/services/categories` — List service categories (Plumbing, Electrical, Carpentry, Painting, Cleaning, AC, Water Filter, Maintenance).
- `POST /api/v1/services/requests` — Submit home maintenance service request.

### Notifications (`/api/v1/notifications`)
- `GET /api/v1/notifications` — List user notifications.
- `PATCH /api/v1/notifications/:id/read` — Mark notification as read.
- `PATCH /api/v1/notifications/read-all` — Mark all user notifications as read.

### System Administration (`/api/v1/admin`)
- `GET /api/v1/admin/stats` — Metrics console (`Admin` only).
