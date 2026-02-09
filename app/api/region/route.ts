import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: "Function execution region check",
    vercel_region: process.env.VERCEL_REGION || "Local/Unknown",
    note: "If you see 'hkg1' here, your configuration is working correctly despite the build logs."
  });
}