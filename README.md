# Shop Counter

A Next.js (App Router) shop counter featuring a cached server-rendered catalogue with URL-driven search/sort, a Staff Desk with shared validation and idempotent payment recording, and a Checkout flow with server-side price snapshotting.

* **Node version**: `v20.x` (check with `node -v` and update)
* **Time spent**: ~X hours (update with your actual time)
* **Shared validation path**: `lib/validation.ts` (exports `validatePayment`)
* **Deployed URL**: `<add-your-vercel-url-here>`

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