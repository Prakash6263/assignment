# Task Management REST API

A production-ready, enterprise-grade RESTful API built with **Node.js**, **Express**, and **MongoDB (Mongoose)**, following clean architecture and 3+ year senior developer best practices.

Repository: [https://github.com/Prakash6263/assignment.git](https://github.com/Prakash6263/assignment.git)

---

## 📁 Project Architecture

```text
src/
├── config/
│   ├── db.config.js             # Mongoose connection with lifecycle events & graceful shutdown
│   └── env.config.js            # Environment variables loader & fail-fast validator
├── constants/
│   ├── httpStatusCodes.js       # Centralized standard HTTP status codes
│   ├── roles.js                 # 'USER' and 'ADMIN' role definitions
│   └── taskConstants.js         # Status & priority enums
├── controllers/
│   ├── auth.controller.js       # Register, login, refresh-token, logout, getProfile
│   └── task.controller.js       # Complete task CRUD + admin oversight
├── middlewares/
│   ├── auth.middleware.js       # JWT Bearer verification & user injection
│   ├── error.middleware.js      # Global error handler (CastError, duplicate key 11000, Zod, JWT)
│   ├── notFound.middleware.js   # Standardized 404 handler
│   ├── rateLimiter.middleware.js# Brute-force protection (5 login attempts / 15m)
│   ├── role.middleware.js       # Role-Based Access Control (`authorize('ADMIN')`)
│   └── validate.middleware.js   # Generic declarative Zod request schema validator
├── models/
│   ├── task.model.js            # User relation, status/priority enums, compound indexes
│   └── user.model.js            # Bcrypt hashing, role enum, refresh token, clean serialization
├── routes/
│   ├── auth.routes.js           # `/api/auth` endpoints
│   ├── index.js                 # Master API router with `/health` check
│   └── task.routes.js           # `/api/tasks` protected CRUD routes
├── services/
│   ├── auth.service.js          # Authentication business logic & token rotation
│   └── task.service.js          # Task business logic, user isolation, search & sorting
├── utils/
│   ├── apiResponse.js           # Standard `{ success, message, data, meta }` response helper
│   ├── AppError.js              # Custom operational error class
│   └── catchAsync.js            # Async wrapper eliminating repetitive try-catch blocks
├── validators/
│   ├── auth.validator.js        # Zod schemas for register, login, refresh token
│   └── task.validator.js        # Zod schemas for task CRUD, ObjectId param, query filters
├── app.js                       # Express app setup, Helmet security, CORS, body limiters
└── server.js                    # Server bootstrap, DB initialization, graceful shutdown
.env                             # Environment variables (ignored by Git)
.env.example                     # Environment template for deployment
package.json                     # NPM dependencies and scripts
README.md                        # Documentation
scripts/
└── verify-requirements.js       # 28-point automated requirements test suite
```

---

## 🔒 Security & Best Practices Highlights

1. **Password Hashing**: Securely hashed with `bcryptjs` (salt rounds: 10) in Mongoose pre-save hooks. Passwords are never stored or returned in plain text.
2. **Dual-Token Authentication (Access & Refresh Tokens)**:
   - **Access Token**: Short-lived (`15m`) used for standard authenticated requests.
   - **Refresh Token**: Long-lived (`7d`) stored securely to obtain new access tokens with token rotation.
   - **Logout**: Invalidates the active refresh token.
3. **Role-Based Access Control (RBAC)**:
   - Users are assigned `USER` (default) or `ADMIN` roles.
   - Administrative routes (`GET /api/tasks/admin/all`) are protected by `authorize('ADMIN')`.
4. **Brute-Force Protection & Rate Limiting**:
   - `express-rate-limit` enforces a maximum of 5 login attempts per 15 minutes per IP address on `POST /api/auth/login`.
5. **Strict User-Level Task Isolation**:
   - Authenticated users can only read, update, or delete tasks belonging to themselves.
   - Ownership is derived strictly from the verified JWT identity (`req.user._id`), never trusted from client request bodies.
6. **Task Sorting by `createdAt` / `dueDate`**:
   - High-performance sorting support: `?sortBy=dueDate:asc`, `?sortBy=dueDate:desc`, `?sortBy=createdAt:desc`.
7. **Schema Validation & ObjectId Safety**:
   - Strictly validated using **Zod**. Invalid MongoDB ObjectIds return a clean `400 Bad Request` before reaching the database, preventing unhandled crashes.
8. **Duplicate Email Handling**:
   - Gracefully handles duplicate email registration returning a clean `409 Conflict` response.
9. **Sensitive Data Redaction**:
   - Passwords and Mongoose `__v` fields are automatically stripped from all JSON responses.
10. **Security Headers**:
    - Protected with `helmet` for HTTP security headers and configurable `cors` policies.
11. **Centralized Error Handling**:
    - Unified `AppError` and global error handling middleware. Internal error stack traces are hidden in production mode.
12. **Standardized API Responses**:
    - Predictable JSON response envelopes for both success and failure across all endpoints.
---

## 💡 Important Design & Security Decisions

1. **Controller-Service-Repository Pattern**:
   - **Controllers** are kept strictly as HTTP request/response routers and status coordinators.
   - **Services** house all business logic, validation rules, token rotations, and database interactions. This decoupling makes testing easy and prevents leaking HTTP-specific logic into database layers.

2. **Strict Identity Derivation (No Insecure Direct Object References - IDOR)**:
   - Client requests can never dictate or override `user` ownership on tasks. Even if a user maliciously sends `{ "user": "otherUserId" }` in the request body, Zod validation rejects it, and the service always overwrites/binds the task to `req.user._id` from the verified JWT token.
   - Read/Update/Delete operations query with `{ _id: taskId, user: req.user._id }`. If another user's task ID is requested, the API returns a generic `404 Not Found` rather than a `403 Forbidden`, intentionally preventing enumeration of existing task IDs across users.

3. **Dual-Token Lifecycle with Refresh Token Rotation**:
   - Access tokens are short-lived (`15m`) to limit exposure if intercepted.
   - Refresh tokens are long-lived (`7d`) and stored in the database. When `/refresh-token` is invoked, a new access token and a **new rotated refresh token** are issued, immediately invalidating the previous one to detect and block token reuse.

4. **Fail-Fast Environment Validation**:
   - The application validates required environment variables (`MONGODB_URI`, `JWT_SECRET`) synchronously before initializing Express or MongoDB. Missing keys fail immediately at boot with clear diagnostics rather than crashing mid-request.

5. **Layered Validation (Zod + Mongoose)**:
   - Input payloads are sanitized and validated with Zod middlewares *before* reaching controller handlers. MongoDB ObjectIds are validated at the parameter boundary, preventing unhandled `CastError` crashes.

6. **Centralized Error Propagation**:
   - Handled via `catchAsync` and a custom `AppError` class.
   - Database errors (e.g. MongoDB code 11000 duplicate keys, Mongoose validation failures, JWT expiration) are translated into uniform, user-friendly JSON responses with proper HTTP status codes, never exposing internal database stack traces in production.

---

## ⚙️ Environment Variables

The application relies on configuration loaded from `.env`. A complete template is provided in `.env.example`:

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `PORT` | Optional | `5000` | Port number the HTTP server listens on |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` or `production`) |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string (Atlas URI or local URI) |
| `DB_NAME` | Optional | `assignment` | Name of the database to use |
| `JWT_SECRET` | **Yes** | — | Cryptographic secret for signing Access Tokens |
| `JWT_EXPIRES_IN` | Optional | `15m` | Lifetime of Access Tokens (e.g., `15m`, `1h`) |
| `JWT_REFRESH_SECRET` | Optional | Derived | Cryptographic secret for signing Refresh Tokens |
| `JWT_REFRESH_EXPIRES_IN` | Optional | `7d` | Lifetime of Refresh Tokens (e.g., `7d`, `30d`) |

### Example `.env` File
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/assignment?retryWrites=true&w=majority
DB_NAME=assignment

# JWT Configuration
JWT_SECRET=super_secret_jwt_key_production_grade_3y_exp_node
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secret_refresh_key_production_grade_3y_exp_node
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🗄️ Database Setup

### Option A: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free shared cluster.
2. Under **Database Access**, create a database user with read and write privileges.
3. Under **Network Access**, add an IP Access entry:
   - For local development: click **Add Current IP Address** or allow access from anywhere (`0.0.0.0/0`).
4. Click **Connect** > **Drivers** (Node.js) and copy the connection string.
5. Paste the connection string into `MONGODB_URI` in `.env`, replacing `<password>` with your user's password.

### Option B: Local MongoDB
If running MongoDB locally via Docker or native service:
```env
MONGODB_URI=mongodb://localhost:27017/assignment
DB_NAME=assignment
```

---

## 🚀 Setup & Installation Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Prakash6263/assignment.git
cd assignment
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 4. Run Automated Requirements Verification
Verify all 28 requirements (validation, password hashing, isolation, error handling):
```bash
npm run verify
```

### 5. Start the Server
```bash
# Development mode (with nodemon auto-restart)
npm run dev

# Production mode
npm start
```
The server will start at: `http://localhost:5000`

---

## 📑 API Endpoints & Documentation

### Base URL
```
http://localhost:5000/api
```

### Standard Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "673f8a...",
    "title": "Complete API task",
    "status": "pending",
    "priority": "high"
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register user (`name`, `email`, `password`, optional `role`) |
| `POST` | `/api/auth/login` | Public (Rate-limited: 5/15m) | Authenticate user, returns `accessToken` & `refreshToken` |
| `POST` | `/api/auth/refresh-token` | Public | Rotate and issue new access token using a valid `refreshToken` |
| `POST` | `/api/auth/logout` | Protected | Invalidate active refresh token in database |
| `GET` | `/api/auth/me` | Protected | Return authenticated user's profile |

#### Register (`POST /api/auth/register`)
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "USER"
}
```
**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "673f8a000000000000000001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2026-10-27T13:00:00.000Z",
      "updatedAt": "2026-10-27T13:00:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "token": "eyJhbGciOi..."
  }
}
```

#### Login (`POST /api/auth/login`)
*Enforces rate limiting (maximum 5 attempts per 15 minutes per IP).*
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```
**Response (`200 OK`)**: Returns `accessToken`, `refreshToken`, and user info.

#### Refresh Token (`POST /api/auth/refresh-token`)
**Request Body**:
```json
{
  "refreshToken": "<YOUR_REFRESH_TOKEN>"
}
```
**Response (`200 OK`)**: Returns new `accessToken` and rotated `refreshToken`.

#### Get Profile (`GET /api/auth/me`)
**Headers**: `Authorization: Bearer <accessToken>`
**Response (`200 OK`)**: Returns authenticated user profile (passwords and internal version keys excluded).

---

### Task Management Routes (`/api/tasks`)

*All task endpoints require the `Authorization: Bearer <accessToken>` header.*

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/tasks` | Protected | Create a new task (automatically associated with logged-in user) |
| `GET` | `/api/tasks` | Protected | List logged-in user's tasks with pagination, filters & sorting |
| `GET` | `/api/tasks/:id` | Protected | Get single task (user-isolated, 404 if not owned) |
| `PUT / PATCH`| `/api/tasks/:id` | Protected | Update task allowed fields (user-isolated) |
| `DELETE` | `/api/tasks/:id` | Protected | Delete task (user-isolated) |
| `GET` | `/api/tasks/admin/all` | Admin only (`ADMIN`) | List all tasks across all users in the system |

#### Create Task (`POST /api/tasks`)
**Request Body**:
```json
{
  "title": "Build Authentication Module",
  "description": "Implement JWT, refresh tokens, and password hashing",
  "priority": "high",
  "status": "in-progress",
  "dueDate": "2026-11-01T00:00:00.000Z"
}
```
- `priority`: `low`, `medium`, `high` (default: `medium`)
- `status`: `pending`, `in-progress`, `completed` (default: `pending`)

**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "673f8a000000000000000002",
    "title": "Build Authentication Module",
    "description": "Implement JWT, refresh tokens, and password hashing",
    "priority": "high",
    "status": "in-progress",
    "dueDate": "2026-11-01T00:00:00.000Z",
    "user": "673f8a000000000000000001",
    "createdAt": "2026-10-27T13:05:00.000Z",
    "updatedAt": "2026-10-27T13:05:00.000Z"
  }
}
```

#### List Tasks (`GET /api/tasks`)
**Query Parameters**:
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `10`, max: `100`)
- `status`: Filter by status (`pending`, `in-progress`, `completed`)
- `priority`: Filter by priority (`low`, `medium`, `high`)
- `search`: Search term matched against `title` and `description`
- `sortBy`: Sorting field & direction:
  - `dueDate:asc` (earliest due first)
  - `dueDate:desc` (latest due first)
  - `createdAt:desc` (newest first, default)
  - `createdAt:asc` (oldest first)

Example:
```
GET /api/tasks?page=1&limit=5&status=in-progress&sortBy=dueDate:asc
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "id": "673f8a000000000000000002",
      "title": "Build Authentication Module",
      "priority": "high",
      "status": "in-progress"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "sortBy": "dueDate",
    "sortOrder": "asc"
  }
}
```

#### Get Task by ID (`GET /api/tasks/:id`)
- Access only own task.
- If given an invalid ObjectId format (e.g., `123`), returns `400 Bad Request`.
- If given a valid ObjectId of another user's task or non-existent task, returns `404 Not Found`.

#### Update Task (`PUT` or `PATCH /api/tasks/:id`)
**Request Body**:
```json
{
  "status": "completed",
  "priority": "medium"
}
```
- Cannot transfer task ownership or alter `_id` or `user`.

#### Delete Task (`DELETE /api/tasks/:id`)
- Deletes only if owned by the authenticated user.

#### Admin: List All Tasks (`GET /api/tasks/admin/all`)
- Requires `role: "ADMIN"`. Populates user details (`name`, `email`, `role`).

---

## 💻 Sample cURL Commands

```bash
# 1. Register User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Prakash","email":"prakash@example.com","password":"Password123"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prakash@example.com","password":"Password123"}'

# 3. Create Task (replace <TOKEN> with your accessToken)
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Complete Node.js Assignment","priority":"high","status":"pending"}'

# 4. List Tasks with sorting
curl -X GET "http://localhost:5000/api/tasks?sortBy=createdAt:desc" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🧪 Automated Testing

The project includes two complementary test suites:

```bash
# 1. Run Supertest API Integration Tests (30 tests: endpoints, rate-limiting, 404s, auth, RBAC)
npm test

# 2. Run Comprehensive Requirement Compliance Suite (28 tests: Zod, bcrypt, isolation, CastError)
npm run verify
```

---

## 📬 Postman Collection

A complete, ready-to-import Postman Collection v2.1.0 is available in the root directory: [`postman_collection.json`](file:///d:/assignment/postman_collection.json).

### Features of the Postman Collection:
- **Organized Folders**: `Health Check`, `Authentication`, `Tasks (CRUD)`, `Admin`.
- **Pre-configured Environment Variables**:
  - `baseUrl` (`http://localhost:5000/api`)
  - `accessToken`
  - `refreshToken`
  - `taskId`
- **Automated Token Management**: The collection includes Postman test scripts on `Register User`, `Login User`, `Refresh Access Token`, and `Create Task` that **automatically capture and store** `accessToken`, `refreshToken`, and `taskId` in collection variables for all subsequent requests!

### How to Import & Use in Postman:
1. Open Postman.
2. Click **Import** (top left).
3. Drag & drop [`postman_collection.json`](file:///d:/assignment/postman_collection.json) or choose the file.
4. Run the requests in order:
   - **Register User** or **Login User** (tokens are automatically stored)
   - **Get Profile (Me)**
   - **Create Task** (taskId is automatically stored)
   - **List Tasks**, **Get Task by ID**, **Update Task**, **Delete Task**

