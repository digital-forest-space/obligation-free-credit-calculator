import { NextResponse } from 'next/server';
import { getVoteCounts, castVote } from '@/lib/votes';

export async function GET() {
  try {
    const votes = await getVoteCounts();
    return NextResponse.json({ votes });
  } catch (e) {
    console.error('votes GET error:', e);
    return NextResponse.json({ votes: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { asset } = await request.json();
    if (!asset || typeof asset !== 'string') {
      return NextResponse.json({ error: 'Missing asset' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const ok = await castVote(asset, ip);
    if (!ok) {
      return NextResponse.json(
        { error: 'Invalid asset name or already voted' },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('votes POST error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
