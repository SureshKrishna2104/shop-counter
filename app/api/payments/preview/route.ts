import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';
import { validatePayment } from '@/app/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = validatePayment(body);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const { email, sku, externalChargeId, extraCode } = parsed.data;
  const product = store.products.find((p) => p.sku === sku)!;
  const extra = extraCode ? product.extras.find((e) => e.code === extraCode) : null;
  const totalCents = product.priceCents + (extra ? extra.priceCents : 0);

  return NextResponse.json({
    ok: true,
    preview: {
      email,
      sku,
      itemName: product.name,
      extraCode: extra ? extra.code : null,
      externalChargeId,
      totalCents,
    },
  });
}