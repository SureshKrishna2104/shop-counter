import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { store, Payment } from '@/app/lib/store';
import { validatePayment } from '@/app/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = validatePayment(body);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const { email, sku, externalChargeId, extraCode } = parsed.data;

  const existing = store.payments.find((p) => p.externalChargeId === externalChargeId);
  if (existing) {
    return NextResponse.json({ ok: true, payment: existing }, { status: 200 });
  }

  const product = store.products.find((p) => p.sku === sku)!;

  if (product.remaining !== null && product.remaining <= 0) {
    return NextResponse.json({ ok: false, error: 'Item is out of stock.' }, { status: 409 });
  }

  const extra = extraCode ? product.extras.find((e) => e.code === extraCode) : null;
  const totalCents = product.priceCents + (extra ? extra.priceCents : 0);

  if (product.remaining !== null) {
    product.remaining -= 1;
  }

  const payment: Payment = {
    email,
    sku,
    itemName: product.name,
    extraCode: extra ? extra.code : null,
    externalChargeId,
    totalCents,
  };
  store.payments.push(payment);

  revalidateTag('catalog',{ expire: 0 });

  return NextResponse.json({ ok: true, payment }, { status: 201 });
}