import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const attempt = store.attempts.get(attemptId);

  if (!attempt) {
    return NextResponse.json(
      { ok: false, error: 'Checkout attempt not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, attempt });
}