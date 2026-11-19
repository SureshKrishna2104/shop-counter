'use client';

import { useState } from 'react';
import { formatUsd } from '@/app/lib/money';
import type { Attempt, Order } from '@/app/lib/store';

const CHECKOUT_ITEMS = [
  { sku: 'notebook', name: 'Field notebook', priceCents: 1500 },
  { sku: 'pen', name: 'Gel pen', priceCents: 400 },
  { sku: 'case', name: 'Slip case', priceCents: 2200 },
];

function hasCartDiverged(cart: Record<string, number>, attempt: Attempt): boolean {
  const liveEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  if (liveEntries.length !== attempt.lines.length) return true;

  const snapshotMap = new Map(attempt.lines.map((l) => [l.sku, l.qty]));
  for (const [sku, qty] of liveEntries) {
    if (snapshotMap.get(sku) !== qty) return true;
  }
  return false;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateQty(sku: string, nextQty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (nextQty <= 0) {
        delete next[sku];
      } else {
        next[sku] = nextQty;
      }
      return next;
    });
    setError(null);
  }

  async function handlePay() {
    setError(null);
    const lines = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([sku, qty]) => ({ sku, qty }));

    if (lines.length === 0) {
      setError('Add an item before paying');
      return;
    }

    const res = await fetch('/api/checkout/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Could not start payment.');
      return;
    }

    setAttempt(json);
    setOrder(null);
  }

  async function handleCompletePayment() {
    if (!attempt) return;
    setError(null);

    const res = await fetch('/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: attempt.attemptId }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Could not complete payment.');
      return;
    }

    setOrder(json);
  }

  const cartTotalCents = CHECKOUT_ITEMS.reduce(
    (sum, item) => sum + item.priceCents * (cart[item.sku] || 0),
    0
  );

  const diverged = attempt !== null && hasCartDiverged(cart, attempt);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="space-y-3 mb-6">
        {CHECKOUT_ITEMS.map((item) => {
          const qty = cart[item.sku] || 0;
          return (
            <div
              key={item.sku}
              className="flex items-center justify-between border border-zinc-800 p-4 rounded"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-zinc-400">
                  {formatUsd(item.priceCents)}
                </div>
              </div>

              {qty === 0 ? (
                <button
                  type="button"
                  onClick={() => updateQty(item.sku, 1)}
                  aria-label={`Add ${item.name}`}
                  className="border border-zinc-700 px-3 py-1 rounded hover:bg-zinc-800"
                >
                  Add
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(item.sku, qty - 1)}
                    aria-label={`Decrease ${item.name}`}
                    className="border border-zinc-700 px-3 py-1 rounded hover:bg-zinc-800"
                  >
                    -
                  </button>
                  <span className="w-6 text-center" aria-label={`${item.name} quantity`}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.sku, qty + 1)}
                    aria-label={`Increase ${item.name}`}
                    className="border border-zinc-700 px-3 py-1 rounded hover:bg-zinc-800"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQty(item.sku, 0)}
                    aria-label={`Remove ${item.name}`}
                    className="border border-zinc-700 px-3 py-1 rounded text-sm text-red-400 hover:bg-zinc-800 ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mb-6">
        <span className="font-semibold">Cart total</span>
        <span className="text-lg font-bold">{formatUsd(cartTotalCents)}</span>
      </div>

      <button
        type="button"
        onClick={handlePay}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-500"
      >
        Pay
      </button>

      {error && (
        <p role="alert" className="text-red-400 mt-4">
          {error}
        </p>
      )}

      {attempt && !order && (
        <section
          aria-labelledby="payment-in-progress-heading"
          className="mt-6 p-4 border border-zinc-700 rounded bg-zinc-900 space-y-3"
        >
          <h2 id="payment-in-progress-heading" className="text-lg font-semibold">
            Payment in progress
          </h2>

          {diverged && (
            <p
              role="status"
              className="p-3 rounded border border-amber-500/50 bg-amber-950/40 text-amber-300 text-sm"
            >
              Your cart changed after payment started. You will be charged the amount below.
            </p>
          )}

          <ul className="text-sm space-y-1">
            {attempt.lines.map((line) => (
              <li key={line.sku}>
                {line.name} × {line.qty} — {formatUsd(line.unitPriceCents * line.qty)}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="font-semibold">Amount due</span>
            <span className="font-bold">{formatUsd(attempt.amountCents)}</span>
          </div>

          <button
            type="button"
            onClick={handleCompletePayment}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
          >
            Complete payment
          </button>
        </section>
      )}

      {order && (
        <section
          aria-labelledby="order-placed-heading"
          className="mt-6 p-4 border border-green-500 rounded bg-green-950/30 space-y-3"
        >
          <h2 id="order-placed-heading" className="text-lg font-semibold text-green-400">
            Order placed
          </h2>
          <p className="text-xs text-zinc-400">Order ID: {order.orderId}</p>
          <ul className="text-sm space-y-1">
            {order.lines.map((line) => (
              <li key={line.sku}>
                {line.name} × {line.qty} — {formatUsd(line.unitPriceCents * line.qty)}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-green-900 pt-3">
            <span className="font-semibold">Amount charged</span>
            <span className="font-bold">{formatUsd(order.amountCents)}</span>
          </div>
        </section>
      )}
    </div>
  );
}