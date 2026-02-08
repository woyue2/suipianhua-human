import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const urlSet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const keySet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!urlSet || !keySet) {
    return NextResponse.json({
      ok: false,
      reachable: false,
      error: 'Env variables missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    }, { status: 500 })
  }

  try {
    const { data, error, status } = await supabase
      .from('documents')
      .select('id')
      .limit(1)

    if (error) {
      // 认为网络联通成功，但可能是表未创建或 RLS 策略限制
      return NextResponse.json({
        ok: true,
        reachable: true,
        dataCount: 0,
        note: 'Supabase reachable; table may not exist or RLS denies access',
        error: { message: error.message, code: (error as unknown as { code?: string }).code, status },
      }, { status: 200 })
    }

    return NextResponse.json({
      ok: true,
      reachable: true,
      dataCount: (data ?? []).length,
    })
  } catch (e: unknown) {
    return NextResponse.json({
      ok: false,
      reachable: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 })
  }
}
