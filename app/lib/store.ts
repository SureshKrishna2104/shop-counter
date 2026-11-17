export type Extra = {
  code: string;
  name: string;
  priceCents: number;
};

export type Product = {
  sku: string;
  name: string;
  priceCents: number;
  remaining: number | null;
  extras: Extra[];
};

export type Payment = {
  email: string;
  sku: string;
  itemName: string;
  extraCode: string | null;
  externalChargeId: string;
  totalCents: number;
};

export type AttemptLine = {
  sku: string;
  name: string;
  unitPriceCents: number;
  qty: number;
};

export type Attempt = {
  attemptId: string;
  lines: AttemptLine[];
  amountCents: number;
};

type Store = {
  products: Product[];
  payments: Payment[];
  attempts: Map<string, Attempt>;
};

// Next.js development mode clears module state on save.
// Attaching the store to globalThis ensures the memory reference persists.
const g = globalThis as { __store?: Store };

export const store = (g.__store ??= {
  products: [
    { sku: "lamp", name: "Maple lamp", priceCents: 8000, remaining: 5, extras: [] },
    { sku: "stool", name: "Cedar stool", priceCents: 12000, remaining: 2, extras: [{ code: "cushion", name: "Cushion", priceCents: 2500 }] },
    { sku: "notebook", name: "Field notebook", priceCents: 1500, remaining: null, extras: [] },
    { sku: "pen", name: "Gel pen", priceCents: 400, remaining: null, extras: [] },
    { sku: "case", name: "Slip case", priceCents: 2200, remaining: null, extras: [] }
  ],
  payments: [],
  attempts: new Map(),
});