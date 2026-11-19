import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';
import { validatePayment } from '@/app/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  const result = validatePayment(body);

  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  const { email, sku, extraCode } = result.data;
  const product = store.products.find((p) => p.sku === sku)!;
  const extra = extraCode ? product.extras.find((e) => e.code === extraCode) : null;
  const totalCents = product.priceCents + (extra ? extra.priceCents : 0);
  const remainingAfter = product.remaining !== null ? Math.max(0, product.remaining - 1) : null;

  return NextResponse.json({
    ok: true,
    preview: {
      email,
      sku: product.sku,
      itemName: product.name,
      extraCode: extra ? extra.code : null,
      extraName: extra ? extra.name : null,
      totalCents,
      remainingAfter,
    },
  });
}