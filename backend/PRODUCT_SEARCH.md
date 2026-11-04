# BuyPal product discovery (initial provider)

The first product-search integration uses a small local demo catalogue. It allows the team to build and test the shopping journey without API credentials or usage fees.

## Endpoint

`GET /api/v1/products/search?q=laptop&currency=INR&maxPrice=70000&limit=10`

Authentication is required. Optional query parameters:
- `q`: free-text search (up to 100 characters)
- `category`: category filter
- `maxPrice`: maximum numeric price
- `currency`: three-letter currency code; defaults to INR
- `limit`: 1–20; defaults to 10

The response labels results with `source: "demo"` and `priceIsLive: false`. These are illustrative entries, not current retailer inventory or offers.

## Checkout handoff

1. The user searches and selects a returned product.
2. The frontend displays the demo price and clearly identifies the demo source.
3. The frontend creates a purchase request through `POST /api/v1/approvals` using the selected product name, price, currency, and the user's Circle ID.
4. The existing approval route checks Circle membership, permissions, per-transaction limit, and daily limit.
5. Only an approved request can be passed to the PayPal order endpoint.

Never trust a price submitted by the browser as a live offer. A production provider integration must fetch and validate the current offer server-side before creating a purchase request.

## Replacing the provider

Implement the same `searchProducts({ query, category, maxPrice, currency, limit })` contract in a retailer/API adapter, then switch the service implementation. Keep provider-specific API keys on the backend and never expose them to the frontend.
