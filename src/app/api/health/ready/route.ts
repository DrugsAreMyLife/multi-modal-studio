import { NextResponse } from 'next/server';

// Readiness probe - checks if the app is ready to receive traffic
// Used by K8s to determine if pod should receive traffic
export const dynamic = 'force-dynamic';

export async function GET() {
  // Basic readiness - app started successfully
  // Add external dependency checks here if needed
  return NextResponse.json(
    {
      status: 'ready',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
