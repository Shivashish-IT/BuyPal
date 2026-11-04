# BuyPal Backend

Node.js 20+ / Express API for the BuyPal prototype. The first milestone provides database-backed email/password authentication.

## Included in this milestone

- Express API with Helmet, restricted credentialed CORS, JSON body limits and rate limiting.
- PostgreSQL users and sessions tables.
- Argon2id password hashing.
- Random opaque session tokens; only SHA-256 token hashes are stored in PostgreSQL.
- HttpOnly, SameSite=Lax session cookie; Secure is enabled in production.
- Routes: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/session`.
- Health check: `GET /health`.

## Local setup

1. Install Node.js 20 or later and PostgreSQL.
2. From this directory run `npm install`.
3. Create a database named `buypal`.
4. Copy `.env.example` to `.env` and update `DATABASE_URL`.
5. Apply the schema: `psql "$DATABASE_URL" -f db/migrations/001_init.sql`.
6. Start the API with `npm run dev`.

The frontend should use `VITE_API_BASE_URL=http://localhost:4000/api/v1` during local development and send credentials (the existing frontend API client already uses `credentials: 'include'`).

## Important security notes

- Never commit `.env`, API keys, OAuth tokens, or customer data.
- Password reset and email verification are not implemented; they require an email delivery provider and token lifecycle.
- Session revocation is available on logout; session-management UI endpoints are not yet implemented.
- Configure HTTPS and a production origin before deployment. For cross-site production deployments, revisit cookie SameSite and CSRF protections together.
- Payment, wallet, delegated-user, UPI and AI shopping endpoints are not implemented in this milestone. No funds are held or transferred by this API.
- Do not treat frontend policy settings or AI output as payment authorization. Enforce all permissions on the server before any future payment adapter is invoked.
