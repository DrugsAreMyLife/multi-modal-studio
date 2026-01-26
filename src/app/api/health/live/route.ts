import { NextResponse } from 'next/server';

// Liveness probe - just checks if the process is alive
// No external dependency checks - used by K8s to determine if pod needs restart
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
