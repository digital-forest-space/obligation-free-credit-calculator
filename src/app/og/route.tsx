import { ImageResponse } from '@vercel/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const asset = searchParams.get('asset') || 'SOL';
  const amount = searchParams.get('amount') || '0';
  const cash = searchParams.get('cash') || '0';
  const dir = searchParams.get('dir') || 'forward';

  const isForward = dir === 'forward';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0F0F13 0%, #1A1A21 50%, #0F0F13 100%)',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: '#8A8A94',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Safe Borrow Capacity
          </div>

          {isForward ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '28px', color: '#8A8A94' }}>
                {parseFloat(amount).toLocaleString()} {asset}
              </div>
              <div style={{ fontSize: '20px', color: '#5C5C66' }}>
                &#x2193;
              </div>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 700,
                  color: '#34D399',
                }}
              >
                {parseFloat(cash).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                {asset}
              </div>
              <div style={{ fontSize: '22px', color: '#8A8A94' }}>
                in free cash
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '28px', color: '#8A8A94' }}>
                Need {parseFloat(cash).toLocaleString()} {asset} cash?
              </div>
              <div style={{ fontSize: '20px', color: '#5C5C66' }}>
                &#x2193;
              </div>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 700,
                  color: '#34D399',
                }}
              >
                {parseFloat(amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                {asset}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            {['0 Interest', '0 Liquidation', '0 Repayment Pressure'].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: '#065F46',
                    color: '#34D399',
                    fontSize: '16px',
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>

          <div
            style={{
              fontSize: '18px',
              color: '#5C5C66',
              marginTop: '16px',
            }}
          >
            Powered by Samsara
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
