import { NextResponse, connection } from 'next/server';
import { store } from '@/app/lib/store';

export async function GET() {
  await connection();
  return NextResponse.json(store.products);
}