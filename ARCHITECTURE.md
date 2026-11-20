# Architecture

## 1. Server vs. Client Split by Route

* **`/`**: Server Component. Immediately redirects to `/shop` via `redirect('/shop')` with zero client JS.
* **`/shop` and `/shop/[sku]`**: Server Components wrapped in `<Suspense>`. Catalogue reads, URL search/sort filtering, metadata generation (`<name> | Shop counter`), and `notFound()` 404 handling all run on the server. The search/sort bar is a plain HTML `<form method="GET">`, keeping the catalogue pages functional with zero client-side JavaScript.
* **`/desk`**: Client Component (`'use client'`). Manages interactive form state via `react-hook-form`, clears the `Cushion` extra automatically when `Maple lamp` is selected, triggers preview/record API calls, and renders the live payment queue. All business validation and stock mutation stay on the server in `validatePayment` and the route handlers.
* **`/checkout`**: Client Component (`'use client'`). Manages the live editable cart, displays real-time divergence warnings, and communicates with `/api/checkout/begin` and `/api/checkout/complete`. All pricing, snapshotting, and order creation happen exclusively on the server.
* **API Route Handlers (`/api/*`)**: Server-only endpoints handling live catalogue reads, payment preview/recording, checkout attempt snapshotting, and debug read counts.

## 2. Caching Strategy & URL Search

* **Caching Choice**: `getCatalog()` wraps `fetchLiveCatalog()` with Next.js `unstable_cache`, tagged with `'catalog'`. Each actual execution of `fetchLiveCatalog()` increments `catalogReads`; cache hits do not.
* **Invalidation on Payment**: When `POST /api/payments` deducts stock, it calls `revalidateTag('catalog', { expire: 0 })`. Using `{ expire: 0 }` forces immediate expiration rather than stale-while-revalidate, so the very next request to `/shop` or `/shop/[sku]` fetches fresh stock and increments `catalogReads` by 1.
* **Handling URL Search (`?q=&sort=`)**: Reading `searchParams` makes `/shop` dynamically rendered per request (Partial Prerendering `◐` in Next.js 16 via `<Suspense>`). Separating the **data cache** (`getCatalog()` via `unstable_cache`) from the **request rendering** solves this: the page renders dynamically for each `?q=` and `?sort=` combination, but it reads from the shared `'catalog'` cache and filters/sorts in memory without re-running `getCatalog()`.
* **Dynamic API Routes**: `GET /api/debug/reads` and `GET /api/catalog` call `await connection()` so Next.js 16 does not statically prerender them at build time.

## 3. Why the Charged Amount Is the Server Snapshot

In `/checkout`, pressing **Pay** calls `POST /api/checkout/begin`, which ignores any client-supplied `unitPriceCents`, prices every SKU from the server catalogue, and freezes an immutable `Attempt` in memory.

If the user edits their cart while payment is in progress, the client compares the live cart against the snapshot and displays the divergence warning, while **Amount due** stays locked to the snapshot. When `POST /api/checkout/complete` runs, it accepts only `{ attemptId }` and builds the order strictly from the stored snapshot. This guarantees that the amount authorized/charged can never diverge from the order actually fulfilled, and prevents client-side price tampering or race conditions.

## 4. What Breaks on Multi-Instance Serverless (e.g., Vercel)

Because `store` lives in Node process memory (`globalThis.__store`), deploying to a serverless host breaks state consistency across instances:

* **Split-brain inventory & queues**: A payment recorded on Instance A deducts stock and updates `store.payments` only on Instance A. A subsequent `/shop` or `/desk` request routed to Instance B will still see old stock and an empty payment queue.
* **Broken idempotency & checkout completion**: Replaying a `chargeId` or calling `/api/checkout/complete` for an `attemptId` created on a different cold-started instance will miss the in-memory `Map` and either double-charge or return `404`.
* **Cold starts**: Idle instances recycle and wipe all in-memory state back to the initial seed.

**What to use instead in production**:
* **PostgreSQL** (e.g., Neon/Supabase) with a unique constraint on `external_charge_id` for idempotency, transactional `UPDATE ... WHERE remaining > 0` for atomic stock deduction, and durable `checkout_attempts` / `orders` tables.
* **Redis** (e.g., Upstash) or Next.js Data Cache backed by a shared cache handler for cross-instance tag invalidation.

## 5. Accessibility Checks

* **Semantic landmarks & labels**: Every form input (`Search`, `Sort`, `Email`, `Item`, `Extra`, `Charge id`) is explicitly associated with a `<label htmlFor>`. Distinct sections (`Payment preview`, `Payment queue`, `Payment in progress`, `Order placed`) use `<section aria-labelledby="...">` so screen readers and Playwright `getByRole('region', { name })` can target them reliably.
* **Live feedback**: Validation errors use `role="alert"` and the cart divergence notice uses `role="status"` for screen-reader announcements.
* **Keyboard & contrast**: Tested full keyboard navigation (`Tab`/`Enter`) across `/shop`, `/desk`, and `/checkout`, and verified dark-mode contrast on native `<select>`/`<option>` menus and alert banners.