# BuyPal frontend

React + Vite prototype implementing the supplied BuyPal dashboard and core product routes.

## Run locally
```bash
cd frontend
npm install
npm run dev
```

## Current state
- Responsive dashboard, wallet, send/receive, circle, AI shopping, transactions, analytics and settings screens.
- Sample data only. No real money movement, authentication, or live product search is enabled.
- UI actions are local demo interactions; connect them to the Node.js backend before enabling payments.

## Next integration step
Set `VITE_API_BASE_URL` to the backend origin and replace demo handlers with typed API calls. Never put PayPal client secrets, Razorpay secrets, OpenAI API keys, or other private credentials in Vite environment variables.
