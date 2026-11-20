# Shop Counter

A Next.js (App Router) shop counter featuring a cached server-rendered catalogue (`/shop`), an idempotent Staff Desk with shared validation (`/desk`), and a Checkout flow backed by server-side price snapshots (`/checkout`).

* **Live URL**: https://shop-counter-eight.vercel.app/shop
* **Node version**: `v26.13.1`
* **Time spent**: ~7.5 hours
* **Shared validation (`validatePayment`)**: `lib/validation.ts`
* **Architecture**: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build and run production server
npm run build
npm start

# Run unit / API tests (Vitest)
npm test

# Run E2E tests (Playwright)
npm run test:e2e
```

## Test Coverage

1. **Checkout divergence (`e2e/shop.spec.ts`)**: Starts payment for a Field notebook ($15), adds a Gel pen to the live cart, verifies `Amount due` stays $15 with the divergence notice, completes payment, and verifies the order only includes the notebook at $15.
2. **Shared validation (`tests/validation.test.ts`)**: Verifies both `POST /api/payments/preview` and `POST /api/payments` reject `cushion` on `lamp`, and confirms preview does not decrement stock.
3. **URL filter (`e2e/shop.spec.ts`)**: Filters by `lamp` on `/shop`, verifies `?q=lamp` persists across reload, and confirms browser Back restores all five items.

## AI tools

* **Tools used**: Gemini for scaffolding route handlers, debugging Next.js 16 Partial Prerendering and `unstable_cache` / `revalidateTag` behavior, and drafting Vitest and Playwright tests.
* **Where I disagreed with the output and why**: The initial checkout draft cleared the active payment attempt whenever the user edited their cart after clicking **Pay**. I disagreed because the spec requires keeping the server snapshot active, warning the user that the cart diverged, and still letting them complete the original snapshot at the locked amount—so I rewrote the checkout state and APIs (`/api/checkout/begin` and `/api/checkout/complete`) to preserve the frozen attempt.