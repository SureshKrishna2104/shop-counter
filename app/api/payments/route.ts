import { NextResponse, connection } from 'next/server';
import { revalidateTag } from 'next/cache';
import { store, Payment } from '@/app/lib/store';
import { validatePayment } from '@/app/lib/validation';

export async function GET() {
  await connection();
  return NextResponse.json({ payments: store.payments });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = validatePayment(body);

  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  const { email, sku, externalChargeId, extraCode } = result.data;

  // Idempotency replay: return 200 with original payment and do not deduct stock
  const existing = store.payments.find((p) => p.externalChargeId === externalChargeId);
  if (existing) {
    return NextResponse.json({ replayed: true, payment: existing }, { status: 200 });
  }

  const product = store.products.find((p) => p.sku === sku)!;

  if (product.remaining !== null && product.remaining <= 0) {
    return NextResponse.json(
      { ok: false, errors: { sku: 'Sold out' } },
      { status: 409 }
    );
  }

  const extra = extraCode ? product.extras.find((e) => e.code === extraCode) : null;
  const totalCents = product.priceCents + (extra ? extra.priceCents : 0);

  if (product.remaining !== null) {
    product.remaining -= 1;
  }

  const payment: Payment = {
    email,
    sku: product.sku,
    itemName: product.name,
    extraCode: extra ? extra.code : null,
    externalChargeId,
    totalCents,
  };

  store.payments.push(payment);
  revalidateTag('catalog', { expire: 0 });

  return NextResponse.json({ replayed: false, payment }, { status: 201 });
}