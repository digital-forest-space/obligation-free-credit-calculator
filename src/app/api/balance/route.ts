import { NextResponse } from 'next/server';
import { address } from '@solana/kit';
import { getRpc } from '@/lib/rpc';

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();
    if (!wallet || typeof wallet !== 'string') {
      return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
    }

    let walletAddr;
    try {
      walletAddr = address(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const rpc = getRpc();
    const { value: lamports } = await rpc.getBalance(walletAddr).send();
    return NextResponse.json({ lamports: lamports.toString() });
  } catch (e) {
    console.error('balance API error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
