# PayPal Sandbox integration (BuyPal)

## Scope
Development-only standard PayPal Checkout. This does not implement platform/partner onboarding, delegated payments, Circle permissions, production payments, or webhook verification.

## Configuration
Copy `.env.example` to `.env` and set `PAYPAL_MODE=sandbox`, `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_CURRENCY=USD`. Never commit `.env` or expose the client secret in frontend code.

## Database
Apply `db/migrations/001_init.sql` first, then `db/migrations/002_paypal_orders.sql`.

## Endpoints
Both endpoints require an authenticated BuyPal session cookie.

### Create order
`POST /api/v1/paypal/orders`

JSON body: `{ "itemName": "Sandbox demo item", "amount": "10.00" }`

Returns `orderId`, `status`, and `approvalUrl`. Redirect the buyer to the approval URL.

### Capture order
`POST /api/v1/paypal/orders/:orderId/capture`

Call after buyer approval. The backend checks the PayPal order status and only captures an APPROVED order owned by the signed-in BuyPal user.

## Local run
From `backend/`: run `npm install`, configure `.env` and PostgreSQL, apply both SQL migrations in order, then run `npm run dev`.

## Important limitations
- This demo accepts amount from the authenticated client. Before production, derive amount and currency from a server-validated cart/catalogue; never trust browser-submitted prices.
- Add PayPal webhook signature verification and reconciliation before relying on payment state.
- Capture idempotency and concurrent capture handling need stronger persistence/locking before production.
- Sandbox checkout success does not prove PayPal India supports BuyPal Circle/delegated payments.
- Use only Sandbox credentials and virtual funds while developing.
