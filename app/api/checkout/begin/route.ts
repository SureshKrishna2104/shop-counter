import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { store, Attempt, AttemptLine } from '@/app/lib/store';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_cart' }, { status: 400 });
  }

  const rawLines = (body as { lines?: unknown })?.lines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return NextResponse.json({ error: 'invalid_cart' }, { status: 400 });
  }

  const lines: AttemptLine[] = [];
  let amountCents = 0;

  for (const entry of rawLines) {
    const sku = typeof entry?.sku === 'string' ? entry.sku : '';
    const qty = Number(entry?.qty);

    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: 'invalid_cart' }, { status: 400 });
    }

    const product = store.products.find((p) => p.sku === sku);
    if (!product) {
      return NextResponse.json({ error: 'invalid_cart' }, { status: 400 });
    }

    // Ignore any unitPriceCents from client; always price from catalogue
    lines.push({
      sku: product.sku,
      name: product.name,
      unitPriceCents: product.priceCents,
      qty,
    });
    amountCents += product.priceCents * qty;
  }

  const attemptId = `att_${crypto.randomUUID().slice(0, 8)}`;
  const attempt: Attempt = {
    attemptId,
    lines: Object.freeze(lines.map((l) => Object.freeze({ ...l }))) as AttemptLine[],
    amountCents,
  };

  store.attempts.set(attemptId, attempt);

  return NextResponse.json(attempt);
}