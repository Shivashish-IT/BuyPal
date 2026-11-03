# Contributing to BuyPal

## Team shape

Four contributors total:

1. Project lead / integration — architecture, reviews, release coordination.
2. Frontend — React UI, onboarding, shared-user screens, shopping and approval experience.
3. Backend — Node.js APIs, data model, identity, authorization, notifications.
4. AI and payments — product discovery and purchase-intent orchestration; PayPal feasibility research and payment adapter in coordination with the backend owner.

The project lead may reassign or split the AI and payments work as the implementation grows.

## Branch naming

- `feature/frontend`
- `feature/backend`
- `feature/ai-agent`
- `feature/payment`
- `docs/<short-topic>`
- `fix/<short-topic>`

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
