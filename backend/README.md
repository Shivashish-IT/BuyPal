# BuyPal Backend

Node.js 20+ / Express API using MongoDB Atlas, Argon2id password hashing and PayPal Sandbox Checkout.

## Included in this milestone

- Express API with Helmet, restricted credentialed CORS, JSON body limits and rate limiting.
- MongoDB/Mongoose persistence for users, sessions and PayPal orders.
- Argon2id password hashing.
- Random opaque session tokens; only SHA-256 token hashes are stored in MongoDB.
- HttpOnly, SameSite=Lax session cookie; Secure is enabled in production.
- MongoDB TTL index for eventual cleanup of expired sessions; authentication also checks expiry directly.
- Routes: POST /api/v1/auth/register, POST /api/v1/auth/login, POST /api/v1/auth/logout, GET /api/v1/auth/session.
- PayPal routes: POST /api/v1/paypal/orders and POST /api/v1/paypal/orders/:orderId/capture.
- Health check: GET /health.

## Local setup

1. Install Node.js 20 or later.
2. Create a MongoDB Atlas cluster and a database user with read/write access to the BuyPal database.
3. In Atlas Network Access, allow your development IP address. Avoid 0.0.0.0/0 except for a short-lived, controlled test.
4. From this directory run npm install.
5. Copy .env.example to .env.
6. Replace MONGODB_URI with your Atlas connection string. URL-encode special characters in the database username/password. Use the database name buypal in the URI.
7. Set the PayPal Sandbox Client ID and Secret in .env. Never put the secret in frontend code or commit .env.
8. Run npm run dev.

The frontend should use VITE_API_BASE_URL=http://localhost:4000/api/v1 during local development and send credentials (credentials: 'include').

## Data collections

- users: normalized email, display name, Argon2 password hash and disabled timestamp.
- sessions: user reference, SHA-256 session-token hash, expiry, user agent and IP address.
- paypalorders: user reference, PayPal order ID, item, decimal-string amount, currency, status and capture ID.

Indexes enforce unique email, session token hash and PayPal order ID. Session expiry is checked in the API; MongoDB's TTL cleanup is asynchronous.

## Security and prototype limitations

- Never commit .env, API keys, OAuth tokens or customer data.
- Password reset and email verification are not implemented; they require an email delivery provider and token lifecycle.
- This milestone implements standard PayPal Checkout only. It does not implement PayPal partner onboarding, delegated payments, Circle permissions, real pooled funds, receiving-money functionality or production payments.
- The demo accepts amount from the authenticated client. Before production, derive amount and currency from a server-validated cart/catalogue; never trust browser-submitted prices.
- Add PayPal webhook signature verification, reconciliation, stronger capture recovery and an audited ledger before relying on payment state.
- Do not treat a MongoDB wallet balance as actual PayPal funds. No customer funds are held by this API.
- Sandbox checkout success does not prove PayPal India supports BuyPal Circle/delegated payments.
- Use only Sandbox credentials and virtual funds while developing.
- Configure HTTPS, production origins, CSRF protections, monitoring and secret rotation before deployment.

## Tests

Run npm test. The health test does not require a live MongoDB connection.
