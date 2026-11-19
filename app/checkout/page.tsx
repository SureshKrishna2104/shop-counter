'use client';

import { useState } from 'react';
import { formatUsd } from '@/app/lib/money';
import type { Attempt } from '@/app/lib/store';

const CATALOG_ITEMS = [
  { sku: 'notebook', name: 'Field notebook', priceCents: 1500 },
  { sku: 'pen', name: 'Gel pen', priceCents: 400 },
  { sku: 'case', name: 'Slip case', priceCents: 2200 },
  { sku: 'lamp', name: 'Maple lamp', priceCents: 8000 },
  { sku: 'stool', name: 'Cedar stool', priceCents: 12000 },
];

export default function CheckoutPage() {
  const [cart, setCart] = useState<Record<string, number>>({ notebook: 1 });
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [confirmed, setConfirmed] = useState<Attempt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateQty(sku: string, delta: number) {
    setCart((prev) => {
      const nextQty = (prev[sku] || 0) + delta;
      const next = { ...prev };
      if (nextQty <= 0) {
        delete next[sku];
      } else {
        next[sku] = nextQty;
      }
      return next;
    });

    // Invalidate any frozen attempt when the cart changes
    if (attempt) {
      setAttempt(null);
      setNotice('Cart changed — previous checkout attempt cleared. Start a new attempt to pay.');
    }
    setConfirmed(null);
    setError(null);
  }

  async function startCheckout() {
    setError(null);
    setNotice(null);
    setConfirmed(null);

    const lines = Object.entries(cart).map(([sku, qty]) => ({ sku, qty }));
    const res = await fetch('/api/checkout/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Could not start checkout.');
      return;
    }

    setAttempt(json.attempt);
  }

  async function confirmAttempt() {
    if (!attempt) return;
    setError(null);

    const res = await fetch(`/api/checkout/attempts/${attempt.attemptId}`);
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || 'Attempt could not be verified.');
      return;
    }

    setConfirmed(json.attempt);
  }

  const cartTotalCents = CATALOG_ITEMS.reduce(
    (sum, item) => sum + item.priceCents * (cart[item.sku] || 0),
    0
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="space-y-3 mb-6">
        {CATALOG_ITEMS.map((item) => {
          const qty = cart[item.sku] || 0;
          return (
            <div
              key={item.sku}
              className="flex items-center justify-between border p-3 rounded"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {formatUsd(item.priceCents)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQty(item.sku, -1)}
                  disabled={qty === 0}
                  className="border px-3 py-1 rounded disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.sku, 1)}
                  className="border px-3 py-1 rounded"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t pt-4 mb-6">
        <span className="font-semibold">Cart Total:</span>
        <span className="text-lg font-bold">{formatUsd(cartTotalCents)}</span>
      </div>

      <button
        type="button"
        onClick={startCheckout}
        disabled={Object.keys(cart).length === 0}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-40"
      >
        Start checkout
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {notice && <p className="text-amber-500 mt-4 text-sm">{notice}</p>}

      {attempt && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="font-semibold mb-2">
            Frozen Attempt ({attempt.attemptId})
          </h2>
          <ul className="text-sm space-y-1 mb-3">
            {attempt.lines.map((line) => (
              <li key={line.sku}>
                {line.name} × {line.qty} — {formatUsd(line.unitPriceCents * line.qty)}
              </li>
            ))}
          </ul>
          <p className="font-bold mb-4">
            Snapshot Total: {formatUsd(attempt.amountCents)}
          </p>
          <button
            type="button"
            onClick={confirmAttempt}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Confirm & Pay
          </button>
        </div>
      )}

      {confirmed && (
        <div className="mt-4 p-4 border border-green-500 rounded">
          <p className="font-semibold text-green-500">
            Confirmed snapshot {confirmed.attemptId} for {formatUsd(confirmed.amountCents)}.
          </p>
        </div>
      )}
    </div>
  );
}