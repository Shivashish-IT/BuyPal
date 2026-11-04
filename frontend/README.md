# BuyPal frontend

Responsive React + Vite prototype based on the supplied BuyPal designs.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Routes and screens

- Public marketing landing page (open from **Visit public website** in the app sidebar).
- Dashboard
- My Wallet
- Send & Receive (send/receive tab interaction)
- My Circle (members, expenses and approvals)
- AI Shopping (assisted/autonomous mode selection, product filtering, saved products and purchase-review dialog)
- Transactions (category filters and demo CSV export)
- Analytics
- Settings (account, security, payment methods, circle, notifications, AI shopping, appearance, region and support)

## API integration

`src/lib/api.js` contains the frontend API client contract for the Node.js backend. Configure the API origin with:

```bash
cp .env.example .env
```

Then set `VITE_API_BASE_URL`, for example `http://localhost:4000/api/v1`.

The current screens intentionally use sample/demo data. The API client is prepared but the UI is not yet wired to a live backend. Payment actions never move real money in this prototype.

## Security boundaries

- Vite variables are public. Never put PayPal, Razorpay, OpenAI or database secrets in `VITE_*` variables.
- Keep provider credentials and AI calls on the Node.js server.
- Treat LLM output as a proposal, not payment authorization.
- Enforce circle membership, spending caps, merchant restrictions and approvals on the server.
- Verify provider webhooks and use idempotency keys for payment operations.

See `../docs/API_INTEGRATION_MAP.md` for the full route-to-provider mapping.
