import { NextResponse, connection } from 'next/server';
import { getReadCount } from '@/app/lib/store';

export async function GET() {
  await connection();
  return NextResponse.json({ catalogReads: getReadCount() });
}