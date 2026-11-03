# Contributing to BuyPal

## Team shape

Four contributors total:

1. **Project lead / integration (you):** architecture, product decisions, reviews, release coordination, and final integration.
2. **Frontend contributor:** React UI, onboarding, delegated-user screens, shopping, and approval experience.
3. **Backend / PayPal contributor:** Node.js APIs, data model, identity, authorization, notifications, and PayPal API feasibility/payment adapter.
4. **AI agent contributor:** product discovery, comparison, structured purchase-intent orchestration, and safety testing.

## Assigned branches

- Project lead: `main` (integration only; do not develop directly on main)
- Frontend: `feature/frontend`
- Backend / PayPal: `feature/backend-payments`
- AI agent: `feature/ai-agent`

For additional work use `docs/<short-topic>` or `fix/<short-topic>`.

## Workflow

1. Pull the latest `main`.
2. Create or switch to your assigned branch.
3. Make focused changes and run tests.
4. Commit with a clear message (e.g. `feat: add delegated-user invitation screen`).
5. Push your branch and open a PR targeting `main`.
6. Link related issues and describe tests, risks, and screenshots where relevant.
7. Request review from the project lead or relevant owner.
8. Merge only after approval and required checks pass.

## Rules

- Do not push directly to `main`.
- Do not commit `.env`, API keys, OAuth tokens, private keys, or customer data.
- Add new configuration keys to `.env.example` with dummy values only.
- Keep payment authorization on the server.
- AI product discovery must not trigger a payment.
- Every checkout action must be checked against server-side user consent and policy.
- Ask before changing shared API contracts or database schemas.
- Keep PRs small and update docs/tests with behavior changes.

## Local setup

Setup commands will be added when the frontend/backend package structure is committed. Until then, coordinate runtime and package choices in the project discussion and record decisions in `docs/DECISIONS.md`.
