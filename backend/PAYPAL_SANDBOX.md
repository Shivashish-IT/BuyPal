# PayPal Sandbox integration (BuyPal)

## Scope

Development-only standard PayPal Checkout backed by MongoDB Atlas. This does not implement PayPal platform/partner onboarding, delegated payments, Circle permissions, production payments, or webhook verification.

## Configuration

Copy .env.example to .env and set MONGODB_URI, PAYPAL_MODE=sandbox, PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_CURRENCY=USD. Never commit .env or expose the client secret in frontend code.

## Database

Mongoose creates the users, sessions and paypalorders collections and their indexes when the application connects. No PostgreSQL server or SQL migration is required.

## Endpoints

Both payment endpoints require an authenticated BuyPal session cookie.

### Create order

POST /api/v1/paypal/orders

JSON body: { "itemName": "Sandbox demo item", "amount": "10.00" }

Returns orderId, status and approvalUrl. Redirect the buyer to the approval URL.

### Capture order

POST /api/v1/paypal/orders/:orderId/capture

Call after buyer approval. The backend checks that the order belongs to the signed-in BuyPal user, fetches the current PayPal order and only captures an APPROVED order. A database state claim prevents concurrent capture requests from starting simultaneously.

## Local run

From backend/: run npm install, configure .env with the Atlas URI and PayPal Sandbox credentials, then run npm run dev.

## Important limitations

- This demo accepts amount from the authenticated client. Before production, derive amount and currency from a server-validated cart/catalogue; never trust browser-submitted prices.
- Add PayPal webhook signature verification and reconciliation before relying on payment state.
- Capture recovery after a network interruption still requires webhook reconciliation and operational review.
- Sandbox checkout success does not prove PayPal India supports BuyPal Circle/delegated payments.
- No wallet balance or real-money transfer is implemented.
- Use only Sandbox credentials and virtual funds while developing.
