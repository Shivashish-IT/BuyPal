# PostgreSQL to MongoDB Atlas migration

The backend-auth branch originally used PostgreSQL tables for users, sessions and PayPal orders. The MongoDB branch replaces those persistence operations with Mongoose models while retaining the existing HTTP routes and JSON response shapes.

## Local developer action

1. Back up any local PostgreSQL data you need. This code change does not migrate existing PostgreSQL records into Atlas.
2. Create an Atlas database user and allowlist your development IP in Network Access.
3. Copy backend/.env.example to backend/.env and set MONGODB_URI to the Atlas connection string, with database name buypal.
4. Keep your PayPal Sandbox credentials in backend/.env.
5. From backend/, run npm install and npm run dev.
6. Register a fresh test account. Existing PostgreSQL users and sessions are not copied automatically.

## Collection mapping

- users -> users
- sessions -> sessions
- paypal_orders -> paypalorders

Passwords remain Argon2id hashes. Session tokens remain random opaque values; only their SHA-256 hashes are persisted. Session expiry is enforced by the API and additionally cleaned up by a MongoDB TTL index.

## Rollback

The original PostgreSQL implementation remains on feature/backend-auth. To roll back locally, switch back to that branch. Do not merge this branch until the team has reviewed the diff and confirmed the migration plan.
