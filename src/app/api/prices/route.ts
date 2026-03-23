import { NextResponse } from 'next/server';
import { fetchAllPrices } from '@/lib/prices';

export async function GET() {
  try {
    const prices = await fetchAllPrices();
    return NextResponse.json(prices);
  } catch (e) {
    console.error('prices API error:', e);
    return NextResponse.json({}, { status: 500 });
  }
}
