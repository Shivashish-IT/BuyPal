# PayPal Circle checkout

## Flow

1. A secondary member creates a purchase request with `POST /api/v1/approvals`.
2. The primary user approves or rejects it through the approval endpoints.
3. The secondary member calls `POST /api/v1/paypal/orders` with:
   ```json
   { "approvalId": "<approved-request-id>" }
   ```
4. The server loads the approved request and creates the PayPal order using the saved item, amount, and currency. The client cannot override the amount.
5. The secondary member opens the returned `approvalUrl` and approves the order with a PayPal Sandbox buyer.
6. The secondary member calls `POST /api/v1/paypal/orders/:orderId/capture`.
7. Before capture, the server rechecks approval state, active Circle membership, current permissions, and exact amount/currency.

## Important limitations

This uses standard PayPal Checkout with buyer approval. It does **not** implement delegated funding from the primary user's PayPal account, PayPal vaulting, a shared PayPal balance, or a BuyPal stored-value wallet.

If a capture request times out after PayPal may have processed it, the local order is marked `RECONCILIATION_REQUIRED`. Do not retry capture blindly; reconcile the PayPal order/capture state first. A production deployment should add PayPal webhooks and a reconciliation worker.

## Sandbox configuration

Set the backend environment variables:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`
- `PAYPAL_CURRENCY=INR` (only if the PayPal Sandbox account and checkout configuration support the currency)
- `FRONTEND_ORIGIN`

Never expose the client secret in frontend environment variables or browser code.
