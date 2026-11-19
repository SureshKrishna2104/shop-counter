import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { store, Attempt, AttemptLine } from '@/app/lib/store';

export async function POST(request: Request) {
  const body = await request.json();
  const rawLines = body?.lines;

  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Cart must contain at least one item.' },
      { status: 400 }
    );
  }

  const lines: AttemptLine[] = [];
  let amountCents = 0;

  for (const entry of rawLines) {
    const sku = typeof entry?.sku === 'string' ? entry.sku : '';
    const qty = Number(entry?.qty);

    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Quantity must be a positive whole number.' },
        { status: 400 }
      );
    }

    const product = store.products.find((p) => p.sku === sku);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: `Unknown item: ${sku}` },
        { status: 400 }
      );
    }

    lines.push({
      sku: product.sku,
      name: product.name,
      unitPriceCents: product.priceCents,
      qty,
    });
    amountCents += product.priceCents * qty;
  }

  const attemptId = `att_${crypto.randomUUID().slice(0, 8)}`;
  const attempt: Attempt = { attemptId, lines, amountCents };

  store.attempts.set(attemptId, attempt);

  return NextResponse.json({ ok: true, attempt }, { status: 201 });
}