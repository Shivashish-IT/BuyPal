# BuyPal — Project Specification

## 1. Vision

Build a prototype for a shared PayPal-oriented spending experience inspired by UPI Circle, combined with an AI shopping assistant.

## 2. Core product areas

### A. Shared spending / delegated users
- A primary user can invite or provision a secondary user in the product's own experience.
- Secondary users may be able to initiate eligible payments without independently linking a bank account, if supported by the approved PayPal integration and applicable rules.
- The primary user can configure spending permissions, transaction limits, expiry, and revocation.
- Receiving-money functionality must be designed only after validating the supported PayPal account and API flows.

### B. AI shopping assistant
- Accept natural-language shopping requests.
- Discover products from approved sources and compare price, availability, specifications, and seller information.
- Explain why a product is recommended and show the final amount before checkout.
- Do not place orders or make purchases as a side effect of product discovery.

### C. Checkout modes
1. **Approval-required mode (default):** AI prepares a cart/checkout intent and the authorized user reviews merchant, item, quantity, total, shipping, and payment source before confirming.
2. **Bounded autonomous mode (opt-in):** only when explicitly enabled by the account owner; enforce merchant/category allowlists, per-order and periodic spending caps, expiry, and a clear revocation switch. Notify the user and record the authorization and result.

The server must independently enforce policy immediately before any payment action. A model response is never payment authorization.

## 3. Roles

- **Primary account holder:** owns the funding relationship and delegated permissions.
- **Secondary user:** can use only the capabilities and limits granted by the primary user.
- **Project administrator:** manages application configuration and team development; cannot access customer payment credentials.
- **AI agent:** discovers and recommends products, prepares purchase intents, and may request a permitted checkout action. It has no unrestricted access to funds.

## 4. High-level architecture

- React frontend for onboarding, shared-user management, shopping, approvals, and transaction history.
- Node.js backend for identity, authorization, policy enforcement, and orchestration.
- AI agent service for product discovery and structured purchase-intent creation.
- Payment adapter isolating official PayPal API calls from application logic.
- Database for users, delegated permissions, policies, purchase intents, transaction references, and audit events.
- Notification service for invitations, approvals, and transaction updates.

## 5. Security and trust requirements

- Use official PayPal OAuth, consent, checkout, and webhook mechanisms where applicable.
- Do not collect or store PayPal account passwords, raw card numbers, or bank credentials.
- Store tokens only using approved secure secret storage; apply least privilege and rotation.
- Enforce authorization, limits, policy expiry, and revocation on the server.
- Use idempotency keys and verify webhook signatures.
- Keep an audit trail of who authorized each action, what policy applied, and what happened.
- Treat product pages, merchant content, and model outputs as untrusted input.
- Never allow prompt text or retrieved content to override payment policy.
- Use sandbox/test accounts during development. Do not test with real money without a formal security and compliance review.

## 6. Non-goals for the initial prototype

- No independent custody or storage of customer funds.
- No bypassing PayPal identity, consent, eligibility, or risk checks.
- No hidden purchases, silent checkout, or automatic ordering during product search.
- No assumption that a secondary-user wallet or pooled balance is supported by PayPal APIs.
- No production launch before API, legal, privacy, and security reviews.

## 7. API feasibility gate

Before implementing payment flows, document:
- Exact PayPal product/API and endpoint used.
- Regional and account eligibility.
- OAuth scopes and consent requirements.
- Whether delegated users and receiving funds are supported.
- Merchant checkout limitations, refunds, disputes, and webhook behavior.
- Sandbox evidence for each end-to-end flow.

If a capability is not supported, clearly mark it as a simulated prototype flow rather than implying a real transfer or payment.

## 8. Definition of done

- Feature works in local development and has automated tests.
- Server-side authorization is tested for allowed and denied cases.
- Secrets are excluded from source control.
- Errors and audit events are handled without exposing sensitive data.
- Documentation and environment examples are updated.
- Pull request is reviewed and approved before merge.
