# FinTrack

FinTrack is a personal finance tracking application for recording transactions, monitoring monthly spending, managing category budgets, and receiving budget notifications. The project is split into an Angular frontend and a Node.js/Express backend connected to Supabase PostgreSQL.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Supabase Database Setup](#supabase-database-setup)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Frontend Routes](#frontend-routes)
- [Backend API](#backend-api)
- [Data Storage](#data-storage)
- [Useful Scripts](#useful-scripts)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

## Features

- Operator registration and login with JWT authentication.
- Password hashing with bcrypt.
- Supabase PostgreSQL persistence for users and transactions.
- Personal transaction creation with description, category, date, amount, type, and status.
- Overview dashboard with monthly income, expenses, remaining budget, savings rate, spending by category, and recent transactions.
- History page with search, filters, summary cards, refresh, and CSV export.
- Budget page with monthly budget metrics, editable category limits, savings goals, and budget CSV export.
- Notifications page for unread/read budget alerts.
- Notification badge on the header bell.
- Budget alerts for:
  - monthly budget almost finished,
  - monthly budget exceeded,
  - projected expense pace above budget,
  - category budget almost finished,
  - category budget exceeded.
- Settings page for profile email, avatar upload/removal, and password changes.
- Avatar preview in the header after upload.
- Responsive sidebar with mobile menu.
- Mobile-first layout refinements for auth, dashboard, history, budgets, settings, support, and notifications.
- Google Material Symbols icons.

## Tech Stack

### Frontend

- Angular 21
- Angular Router
- Angular Forms
- Angular SSR project structure
- RxJS
- Material Symbols font icons
- CSS media queries and container queries for responsiveness

### Backend

- Node.js
- Express 5
- PostgreSQL via `pg`
- Supabase PostgreSQL
- JSON Web Tokens via `jsonwebtoken`
- Password hashing via `bcryptjs`
- CORS via `cors`
- Environment variables via `dotenv`

## Project Structure

```text
fin-track-app/
  README.md
  fin-track/
    angular.json
    package.json
    src/
      index.html
      styles.css
      app/
        api.service.ts
        notification.service.ts
        app.routes.ts
        components/
          add-transaction/
          auth/
          budget/
          header/
          history/
          notifications/
          overview/
          settings/
          sidebar/
          support/
  fin-track-backend/
    .env.example
    db.js
    package.json
    server.js
```

## Prerequisites

Install these before running the app:

- Node.js 20 or newer
- npm
- A Supabase project
- A Supabase PostgreSQL connection string

Check your local versions:

```bash
node --version
npm --version
```

## Supabase Database Setup

The backend connects directly to Supabase PostgreSQL through `DATABASE_URL`.

You do not need to manually create the tables for the current version. On startup, `fin-track-backend/server.js` runs `ensureDatabase()` and creates the required tables if they do not exist.

### Tables Created by the Backend

#### `system_operators`

Stores application users.

```sql
CREATE TABLE IF NOT EXISTS system_operators (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  profile_avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `transactions`

Stores user transaction records.

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES system_operators(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Environment Variables

Create a backend `.env` file from the example:

```bash
cd fin-track-backend
copy .env.example .env
```

On macOS/Linux:

```bash
cd fin-track-backend
cp .env.example .env
```

Then edit `fin-track-backend/.env`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-HOST]:5432/postgres
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_ORIGIN=http://localhost:4200
```

### Variable Meaning

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string. |
| `JWT_SECRET` | Recommended | Secret used to sign login tokens. |
| `CLIENT_ORIGIN` | Recommended | Frontend origin allowed by CORS. |
| `PORT` | Optional | Backend port. Defaults to `3000`. |

## Installation

Install backend dependencies:

```bash
cd fin-track-backend
npm install
```

Install frontend dependencies:

```bash
cd ../fin-track
npm install
```

## Running the Project

You need two terminals: one for the backend and one for the frontend.

### 1. Start the Backend

```bash
cd fin-track-backend
npm run dev
```

The backend should start at:

```text
http://localhost:3000
```

You can test it in the browser:

```text
http://localhost:3000/
```

Expected response:

```json
{
  "name": "FinTrack API",
  "database": "Supabase PostgreSQL",
  "status": "running"
}
```

### 2. Start the Frontend

```bash
cd fin-track
npm start
```

The frontend usually runs at:

```text
http://localhost:4200
```

If port `4200` is busy, run:

```bash
npm start -- --host 127.0.0.1 --port 4201
```

The backend currently allows Angular development origins on ports in the `4200` range.

## Frontend Routes

| Route | Page |
| --- | --- |
| `/auth` | Login and register screen |
| `/overview` | Monthly finance overview dashboard |
| `/history` | Searchable and filterable transaction history |
| `/budget` | Budget and savings goals management |
| `/add-transaction` | Create a new transaction |
| `/notifications` | Budget notification inbox |
| `/settings` | Profile, avatar, email, and password settings |
| `/support` | Support information |
| `/` | Redirects to `/auth` |
| `**` | Redirects to `/auth` |

## Backend API

Base URL:

```text
http://localhost:3000/api
```

Authenticated routes require:

```http
Authorization: Bearer <token>
```

### Health Check

```http
GET /
```

Returns API status information.

### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "username": "ignite",
  "email": "ignite@example.com",
  "password": "secret123"
}
```

Possible responses:

- `201` account created
- `400` missing fields
- `409` username or email already exists
- `500` registration failed

### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "username": "ignite",
  "password": "secret123"
}
```

Response body:

```json
{
  "message": "Authentication successful.",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "ignite",
    "email": "ignite@example.com",
    "profileAvatar": null
  }
}
```

Possible responses:

- `200` login successful
- `400` missing fields
- `401` invalid credentials
- `500` login failed

### Current User

```http
GET /api/auth/me
```

Requires authentication.

Returns the logged-in user.

### Update Profile

```http
PATCH /api/auth/profile
```

Requires authentication.

Request body:

```json
{
  "email": "new-email@example.com",
  "profileAvatar": "data:image/png;base64,..."
}
```

Notes:

- `profileAvatar` can be `null`.
- The frontend limits avatar files to 1.5 MB.
- The backend accepts JSON request bodies up to 2 MB.

### Change Password

```http
PATCH /api/auth/password
```

Requires authentication.

Request body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

### List Transactions

```http
GET /api/transactions
```

Requires authentication.

Returns all transactions for the logged-in user ordered by date descending.

### Create Transaction

```http
POST /api/transactions
```

Requires authentication.

Request body:

```json
{
  "description": "Mac book",
  "category": "Housing",
  "date": "2026-05-28",
  "amount": 300000,
  "type": "expense",
  "status": "Completed"
}
```

Rules:

- `description`, `category`, `date`, `amount`, and `type` are required.
- `amount` must be greater than zero.
- `type` must be either `income` or `expense`.
- `status` defaults to `Completed` if omitted.

## Data Storage

### Supabase PostgreSQL

The backend stores:

- users in `system_operators`,
- transactions in `transactions`,
- profile avatars as Data URL text in `system_operators.profile_avatar`.

### Browser Local Storage

The frontend uses local storage for client-side state:

| Key | Purpose |
| --- | --- |
| `fintrack_token` | JWT auth token |
| `fintrack_user` | Cached current user |
| `fintrack_budget_limits` | Local category budget limits |
| `fintrack_savings_goals` | Local savings goals |
| `fintrack_notifications` | Local notification inbox |

## Useful Scripts

### Frontend

Run these inside `fin-track/`.

| Command | Description |
| --- | --- |
| `npm start` | Start Angular dev server |
| `npm run build` | Build Angular app |
| `npm run watch` | Build in watch mode |
| `npm test` | Run frontend tests |
| `node --max-old-space-size=4096 node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` | Type-check the Angular app without building |

### Backend

Run these inside `fin-track-backend/`.

| Command | Description |
| --- | --- |
| `npm run dev` | Start backend server |
| `npm start` | Start backend server |
| `npm test` | Syntax-check `server.js` |

## Testing and Verification

### Backend Syntax Check

```bash
cd fin-track-backend
npm test
```

### Frontend Type Check

```bash
cd fin-track
node --max-old-space-size=4096 node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
```

### Frontend Production Build

```bash
cd fin-track
npm run build
```

The build may show CSS budget warnings because several component style files are larger than Angular's default warning budget. These warnings do not stop the build unless they exceed the configured error threshold.

## Troubleshooting

### Backend says `DATABASE_URL is missing`

Create `fin-track-backend/.env` and add a valid Supabase PostgreSQL connection string.

### Login/Register requests fail with CORS errors

Check that:

- the backend is running on `http://localhost:3000`,
- the frontend is running on a `localhost` or `127.0.0.1` port in the Angular dev range,
- `CLIENT_ORIGIN` in `.env` matches your frontend URL if you use a custom port.

### Frontend cannot reach the server

The frontend API base is currently hardcoded in:

```text
fin-track/src/app/api.service.ts
```

Current value:

```ts
private apiUrl = 'http://localhost:3000/api';
```

If the backend runs somewhere else, update that value.

### `Header "host" ... is not allowed`

Run the Angular dev server with an allowed host:

```bash
npm start -- --host 127.0.0.1 --port 4200
```

or use another port in the `4200` range.

### Production build fails while fetching Google fonts

The project disables production font inlining in `angular.json` so builds do not depend on fetching Material Symbols during the build. The browser still loads the Material Symbols stylesheet at runtime from `src/index.html`.

### Supabase connection fails

Check:

- the Supabase database password,
- the project host in `DATABASE_URL`,
- whether the connection string is the direct PostgreSQL URI,
- that SSL is allowed. The backend uses `ssl: { rejectUnauthorized: false }`.

## Future Improvements

- Move the frontend API base URL into an environment file.
- Store budget limits, savings goals, and notifications in Supabase instead of local storage.
- Add edit/delete support for transactions.
- Add server-side pagination for large transaction histories.
- Add route guards so authenticated pages redirect to `/auth` when no token exists.
- Add refresh-token support for longer sessions.
- Store avatars in Supabase Storage instead of the users table.
- Add unit tests and end-to-end tests for auth, transactions, budgets, and notifications.

## Author

FinTrack was built as a personal transaction tracking application for managing financial records, budgets, and account settings.
