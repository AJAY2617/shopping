# Leo Shopping

A responsive, Flipkart-inspired shopping storefront with a password-protected admin page at `/admin`, deployed on Vercel.

Install dependencies with `npm install`, then run `node --env-file=.env.local scripts/dev.mjs`. Visit `http://127.0.0.1:4173` and `/admin`. Set `ADMIN_PASSWORD` (16+ characters) and `SESSION_SECRET` (32+ characters) in your ignored `.env.local`. Local development stores catalog changes under `.local-data`, separate from the hosted catalog.

## Features

- Product search, category filters, price and rating sorting
- Product details and an in-memory wishlist
- Cart quantities, removal and illustrative delivery calculation
- Validated demo checkout; no network submission, payment or fulfilment
- Responsive layouts and accessible dialogs
- Admin sign-in, product creation and editing, prices, images, and show/hide controls
- Shared catalog in private Vercel Blob storage, with ETag checks to prevent stale saves

## Admin access and deployment

The owner password is stored in the ignored `admin-access.txt`. Production requires `ADMIN_PASSWORD`, `SESSION_SECRET` and a connected private Vercel Blob store. The initial catalog is seeded at `leo-shopping/catalog.json` in Blob storage.

Admin sessions are signed, expire after eight hours, and use HTTP-only same-site cookies (secure in production). Write requests require authenticated same-origin access and validated product data. Rotate `ADMIN_PASSWORD` and `SESSION_SECRET` in Vercel project settings and redeploy to change admin access.

Run `npm test` and `npm run build`, then `vercel --prod`. `vercel.json` configures the static pages, `/admin` route and server functions. Saved admin changes appear in the storefront on refresh without redeployment.

The catalog, prices, specifications and ratings are samples. Cart and wishlist reset on reload. Real commerce requires verified catalog data, durable orders, payment processing and fulfilment services.

Logo: https://github.com/AJAY2617/leo/tree/main/leo/logo

Photo credits and source URLs: `asset-sources.json`.
