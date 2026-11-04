# BuyPal Circle API

All routes below require an authenticated BuyPal session cookie.

## Circle lifecycle

- `POST /api/v1/circles` — create a Circle. Body: `{ "name": "Family Circle" }`.
- `GET /api/v1/circles` — list Circles where the signed-in user is primary or active secondary.
- `POST /api/v1/circles/:circleId/invitations` — primary user invites an email. Optional permissions: `canShop`, `canPay`, `canReceive`, `autoApprove`, `perTransactionLimit`, `dailyLimit`, and `currency`.
- `GET /api/v1/circles/invitations/pending` — list invitations for the signed-in email.
- `POST /api/v1/circles/:circleId/invitations/:memberId/accept` — invited user accepts while signed in with the invited email.
- `PATCH /api/v1/circles/:circleId/members/:memberId/permissions` — primary user changes a secondary member's permissions.
- `DELETE /api/v1/circles/:circleId/members/:memberId` — primary user revokes a secondary member.

## Safety and current scope

- A secondary membership is pending until the invited email's account accepts it.
- Only the Circle primary user can invite, change permissions, or revoke a secondary member.
- Revocation disables shopping, paying, receiving, and automatic approval permissions.
- New secondary members default to `autoApprove: false` and zero spending limits.
- Spending limits and permissions are policy data only at this stage. Payment execution must enforce these policies server-side before creating/capturing any PayPal order.
- No money is held in a BuyPal wallet and these endpoints do not move funds.
- Invitations are in-app records; email delivery is not implemented yet.
