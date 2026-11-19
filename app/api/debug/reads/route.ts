import { NextResponse } from 'next/server';
import { getReadCount } from '@/app/lib/store';

export async function GET() {
  return NextResponse.json({ catalogReads: getReadCount() });
}