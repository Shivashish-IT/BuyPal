# BuyPal Purchase Approval Engine

All endpoints require a signed-in session.

- `POST /api/v1/approvals`: secondary member requests a purchase. Body: `{ "circleId": "<id>", "itemName": "Headphones", "amount": "49.99", "currency": "USD" }`.
- `GET /api/v1/approvals/pending`: primary user lists pending requests addressed to them.
- `POST /api/v1/approvals/:approvalId/decision`: primary user decides with `{ "decision": "approve" }` or `{ "decision": "reject", "note": "Outside budget" }`.
- `GET /api/v1/approvals/mine`: secondary user lists their recent requests.

The engine checks active Circle membership, shopping and payment permissions, policy currency, per-transaction limit, and daily limit. Pending and approved requests count against the daily limit so that waiting approvals reserve budget. Rejected requests no longer count. Auto-approval is only applied when the member's saved policy enables it and all limits pass.

**Important:** This API only creates and decides authorization records. It does not create a PayPal order, capture money, or represent a stored-value wallet. PayPal checkout must consume an approved record and re-check the current Circle policy before any capture. A denied, rejected, revoked, or stale authorization must never be captured.
