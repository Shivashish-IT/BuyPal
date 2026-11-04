# BuyPal frontend

Responsive React + Vite prototype for the BuyPal shared-payments and AI-shopping concept.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite normally starts at `http://localhost:5173`.

## Screens and interactions

- Public marketing landing page, with sign-in and get-started actions.
- Authentication UI: sign in, registration, password-reset request and demo entry.
- Dashboard, wallet, send/receive, circle, AI shopping, transactions, analytics and settings.
- My Circle: member invitations, per-member permission/limit dialog, shared expense form and approval decisions.
- AI Shopping: assisted/autonomous mode selection, product search, saved products, side-by-side comparison (up to three products) and purchase approval review.
- Transactions: category filters and CSV export.
- Settings: editable profile, security preferences, payment methods, circle navigation, notification preferences, AI policy preview, light/dark theme, language/region and help.
- Notification dropdown and responsive mobile navigation.

## Backend configuration

`src/lib/api.js` contains the proposed frontend API client contract for the Node.js backend. Set the API origin in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

The API client includes auth/session, profile, security, wallet, payment methods, payment intents, circles, permissions, approvals, AI shopping, transactions, analytics and notifications.

**Important:** The UI currently runs with sample/demo data. Authentication forms and payment actions are not connected to a live backend. The demo sign-in is not real authentication. No action moves real money or places a merchant order.

## Build and manual QA

```bash
npm run build
npm run preview
```

Suggested manual checks:
1. Open the public page, use Log in/Get started, switch between sign-in, registration and forgot-password.
2. Try demo entry, navigate through each dashboard section and use the mobile menu at narrow widths.
3. Edit the profile and confirm the new values appear in account and sidebar areas.
4. Open notification dropdown; mark demo notices read and navigate to activity.
5. Open My Circle; test invite, shared expense, member permission and approval dialogs.
6. In AI Shopping, search, save products, compare up to three products, remove a comparison item and review a purchase.
7. Export the demo transactions CSV and test transaction category filters.
8. Toggle dark appearance and verify the app theme changes.
9. Run `npm run build` and fix any build warnings/errors before deployment.

## Security boundaries

- Vite variables are public. Never put PayPal, Razorpay, OpenAI or database secrets in `VITE_*` variables.
- Keep provider credentials and AI calls on the Node.js server.
- Treat LLM output as a proposal, not payment authorization.
- Enforce circle membership, spending caps, merchant restrictions and approvals on the server.
- Verify provider webhooks and use idempotency keys for payment operations.
- Use secure, HttpOnly sessions; do not store passwords or provider credentials in browser storage.

See `../docs/API_INTEGRATION_MAP.md` for the route-to-provider mapping and India-specific payment feasibility notes.
