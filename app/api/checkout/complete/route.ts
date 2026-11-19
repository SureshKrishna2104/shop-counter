import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { store, Order } from '@/app/lib/store';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_attempt' }, { status: 400 });
  }

  const attemptId = (body as { attemptId?: unknown })?.attemptId;
  if (typeof attemptId !== 'string' || !attemptId) {
    return NextResponse.json({ error: 'invalid_attempt' }, { status: 400 });
  }

  // Idempotent: completing the same attempt again returns the same order
  const existingOrder = store.orders.get(attemptId);
  if (existingOrder) {
    return NextResponse.json(existingOrder);
  }

  const attempt = store.attempts.get(attemptId);
  if (!attempt) {
    return NextResponse.json({ error: 'attempt_not_found' }, { status: 404 });
  }

  const order: Order = {
    orderId: `ord_${crypto.randomUUID().slice(0, 8)}`,
    attemptId: attempt.attemptId,
    lines: attempt.lines,
    amountCents: attempt.amountCents,
  };

  store.orders.set(attemptId, order);

  return NextResponse.json(order);
}