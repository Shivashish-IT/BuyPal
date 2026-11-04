# BuyPal API integration map

This is the proposed frontend-to-backend contract. All routes below are **BuyPal Node.js API routes**, not direct browser calls to PayPal, Razorpay, OpenAI, or product providers.

Base path: `/api/v1`

## 1. Frontend route → BuyPal API

| UI route | BuyPal endpoint(s) | Purpose |
|---|---|---|
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`, `POST /auth/password/reset-request`, `POST /auth/password/reset`, `POST /auth/password/change` | Registration, sign-in, session checks, sign-out and password recovery/change |
| Dashboard | `GET /dashboard/summary`, `GET /transactions?limit=5`, `GET /circles?mine=true`, `GET /approvals?status=pending` | Wallet snapshot, recent activity, circle summary, pending approvals |
| My Wallet | `GET /wallet`, `GET /wallet/activity`, `GET /payment-methods`, `POST /wallet/topups`, `POST /wallet/withdrawals`, `PATCH /wallet/limits` | Display ledger and payment methods; create provider-backed intents; configure limits |
| Send & Receive | `POST /payment-intents`, `GET /contacts`, `POST /receive-requests`, `GET /receive-requests/:id` | Resolve recipient, create a payment intent, create a payment request/QR payload |
| My Circle | `GET /circles/:circleId`, `POST /circles`, `POST /circles/:id/invitations`, `PATCH /circles/:id/members/:memberId/permissions`, `DELETE /circles/:id/members/:memberId`, `GET /circles/:id/expenses`, `POST /circles/:id/expenses`, `GET /approvals`, `POST /approvals/:id/decision` | Circle membership, invitations, server-enforced limits, shared expenses and approvals |
| AI Shopping | `POST /ai/shopping/search`, `POST /ai/shopping/compare`, `POST /purchase-intents`, `GET /purchase-intents/:id`, `POST /purchase-intents/:id/approve`, `POST /purchase-intents/:id/cancel`, `PATCH /shopping-policy` | Product discovery, comparison, prepare a cart, ask for approval, cancel, configure bounded policy |
| Transactions | `GET /transactions`, `GET /transactions/:id`, `GET /orders/:id`, `POST /transactions/export` | Filtered ledger, transaction details, merchant order status, export |
| Analytics | `GET /analytics/overview`, `GET /analytics/spending?period=month`, `GET /analytics/categories`, `GET /analytics/merchants`, `GET /analytics/insights` | Spending charts, trends, merchants, explainable insights |
| Settings | `GET /me`, `PATCH /me`, `GET /security/sessions`, `POST /security/sessions/revoke`, `GET /notifications/preferences`, `PATCH /notifications/preferences`, `GET /circle-policy`, `PATCH /circle-policy` | Profile, security, notification preferences and consent/policy controls |
| Global search | `GET /search?q=...` | Search only data the signed-in user is allowed to see |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` | Notification inbox and read state |

## 2. External integrations behind the backend

| Capability | Provider/API | Where it is used | Notes |
|---|---|---|---|
| Sign-in | Auth.js / managed OIDC provider (or app-managed session) | Login, settings, all protected routes | Use short-lived secure, HttpOnly cookies; do not build your own password crypto |
| International PayPal checkout | PayPal REST OAuth 2.0 + Orders v2 | Purchase intent checkout where merchant, payer and country are eligible | Create and capture orders on the server. Browser must never receive the client secret. |
| PayPal disbursements | PayPal Payouts API | Only eligible business payout use cases | Not a generic peer-to-peer wallet API. Validate account, recipient consent, region and allowed use case. |
| PayPal payment-method tokenization | PayPal Payment Method Tokens / Vault (where eligible) | Approved saved payment method flows | Tokenization/consent only; do not store card or bank credentials. |
| PayPal event updates | PayPal Webhooks | Order/payment/refund/dispute status | Verify webhook signatures and make handlers idempotent. |
| India merchant checkout | Razorpay Orders + Checkout + Payments + Webhooks | Merchant payments/top-ups only if approved for your business model | Not a general-purpose P2P wallet or permission to custody funds. |
| Split settlement | Razorpay Route | Marketplace/vendor settlement to approved linked accounts | Only if Razorpay approves the platform and linked-account model; not a substitute for UPI Circle. |
| AI assistant | OpenAI Responses API + function calling | `/ai/shopping/*` and purchase-intent preparation | Expose safe tools such as search_catalog and compare_offers. Never expose a pay-now tool without a separate deterministic authorization gate. |
| Product discovery | Approved catalog/affiliate APIs or a licensed product-search provider | AI shopping search/compare | Select a provider after checking India coverage, terms, price/stock freshness, attribution and cost. Do not scrape retailer sites without permission. |
| Notifications | Resend/SendGrid (email), Firebase Cloud Messaging (push) | Invitations, approvals, receipts | Keep notification content minimal; deep links must re-check authorization. |
| Analytics | Internal SQL queries + scheduled aggregation | Analytics route | Avoid sending personal payment data to analytics vendors by default. |

## 3. India-specific payment feasibility — blocking product decision

**PayPal India does not support domestic payments between Indian users.** PayPal's India help page says Indian users cannot receive domestic payments, and PayPal's India fee page says India accounts support international payments only. Therefore the screens' INR/UPI-style send-to-family flow cannot be implemented as a domestic PayPal Circle transfer for Indian residents.

- PayPal can still be evaluated for eligible international commerce flows, subject to account type, country and product eligibility.
- Razorpay can support approved merchant checkout and approved platform/vendor settlement use cases. Razorpay Route is not a consumer P2P wallet and does not by itself authorize pooled balances or secondary-user spending.
- For real domestic UPI/P2P, wallet custody, delegated payments, or stored-value balances, obtain a regulated bank/PSP/wallet partner and legal/compliance review. Until then, label these screens **demo/simulated** and do not represent ledger entries as real money.
- The BuyPal database should maintain a non-custodial **display ledger** of verified provider transaction references, not a user-fundable balance, unless a licensed partner and compliant model are secured.

## 4. Payment and AI safety contract

1. Frontend asks the backend to create a `payment-intent` or `purchase-intent`; it never calls a payment provider with a secret.
2. Backend authenticates the account, checks the actor's role, circle membership, recipient, merchant, amount, currency, expiry, velocity and policy.
3. AI can only return a structured product shortlist and proposed purchase intent. An LLM output is never authorization.
4. Approval-required is the default. The primary account holder confirms the exact merchant, items, quantity, total, shipping and funding source.
5. For opt-in autonomous mode, a deterministic policy service checks allowlists, per-order and period caps, expiry and revocation immediately before checkout.
6. Use idempotency keys on create/capture/refund operations. Treat provider webhooks as the authoritative payment state and verify their signatures.
7. Audit who initiated, who approved, which policy passed, provider reference, final status and timestamps. Never log tokens or sensitive payment data.

## 5. Suggested backend module ownership

- `auth/`: sessions, OIDC, user profile
- `wallet/`: display ledger, payment methods, limits
- `payments/`: provider adapter interface, PayPal/Razorpay adapters, idempotency
- `circles/`: invitations, memberships, permission policies, shared expenses
- `approvals/`: approval queue and decisions
- `shopping/`: catalog provider adapters and comparison
- `ai/`: OpenAI Responses API orchestration and strict tool schemas
- `transactions/`: normalized transaction history
- `analytics/`: aggregation and insights
- `webhooks/`: provider signature verification and event processing

## Official references

- PayPal Orders API: https://developer.paypal.com/api/rest/integration/orders-api/
- PayPal REST API getting started/OAuth: https://developer.paypal.com/api/get-started/
- PayPal REST API specifications: https://github.com/paypal/paypal-rest-api-specifications
- PayPal India domestic-payment limitation: https://www.paypal.com/in/cshelp/article/can-i-use-paypal-to-receive-payments-from-indian-customers-help1049
- Razorpay Route: https://razorpay.com/route/
- Razorpay Route API list: https://d6xcmfyh68wv8.cloudfront.net/docs/payments/route/apis/
- OpenAI Responses API: https://developers.openai.com/api/reference/responses/overview
- OpenAI function calling: https://developers.openai.com/api/docs/guides/function-calling
