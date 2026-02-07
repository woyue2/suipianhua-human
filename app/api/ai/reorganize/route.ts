import { NextRequest, NextResponse } from 'next/server';
import { reorganizeOutline } from '@/app/actions/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await reorganizeOutline(body.currentTree);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI reorganize error:', error);
    return NextResponse.json(
      { error: 'Failed to reorganize outline' },
      { status: 500 }
    );
  }
}
