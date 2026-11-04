# BuyPal verified product discovery

BuyPal uses a verified-only policy. It does not scrape retailer pages, invent listings, or fall back to a demo catalogue.

## Built-in trusted platforms

- Amazon India — official Creators API; requires Amazon Associates enrolment and API eligibility/credentials.
- Flipkart — official Affiliate API; requires affiliate registration and API access.
- Swiggy — official developer/Builders Club APIs; requires the relevant API credentials and production access where applicable.
- Zomato and Blinkit — require an authorised partner integration. BuyPal will not assume that an undocumented consumer search API exists.

A platform being on the trusted list does not mean its API is already connected. The platform status endpoint reports that distinction.

## Endpoints

- `GET /api/v1/products/platforms` — list trusted platforms and connection status.
- `GET /api/v1/products/search?q=Samsung%2025W%20charger&currency=INR&limit=10` — search connected providers.

Authentication is required. Search requires a non-empty query. Optional filters are `category`, `maxPrice`, `currency` and `limit`.

## Verified-result contract

A provider must be backed by an authorised retailer API or partner integration and return `verified: true`, a retailer-hosted product URL, a valid numeric price and currency. The aggregator filters out results that do not meet this contract. Providers must not set `verified: true` for scraped or guessed data.

When a platform is not connected, errors, or returns no verified match, its result list remains empty and the response explains why. BuyPal never silently substitutes another source.

## Recommendation policy

Current ranking is by listed price among verified results. Before checkout, the UI must clearly show the retailer, exact listing, last checked time, delivery availability/fees if supplied by the provider, and direct product link. Do not claim the cheapest final payable option unless comparable delivery fees and discounts are available from every compared provider.

## Provider integration

Use `registerProductProvider(platformId, { search })` to register an authorised provider implementation. Keep credentials server-side. Do not register browser scraping, unofficial private endpoints, or static mock catalogues as verified providers.

## Current implementation status

The trusted-platform registry, fail-closed aggregator, API endpoints and tests are implemented. No retailer credentials or authorised partner connections have been supplied yet, so the API correctly returns zero verified products until a provider is integrated and connected.
