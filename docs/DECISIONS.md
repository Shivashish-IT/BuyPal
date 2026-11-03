# BuyPal Decision Log

Record important decisions here using the format: date, decision, context, alternatives, consequences, owner.

## 2026-11-03 — Initial collaboration and product guardrails

- Repository: `Shivashish-IT/BuyPal`.
- Default branch: `main`.
- Initial frontend direction: React.
- Initial backend direction: Node.js.
- Product concept: shared/delegated spending experience plus AI product discovery.
- Checkout modes: approval-required by default; bounded autonomous checkout only after explicit opt-in and server-side policy checks.
- Important constraint: validate all PayPal capabilities against official APIs and sandbox; do not assume UPI Circle-like delegation or secondary-user receiving is available.
