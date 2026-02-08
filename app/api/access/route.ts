import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const input = (body?.password ?? '').toString().trim()
    const envPassword = (process.env.APP_ACCESS_PASSWORD ?? '').toString().trim()

    if (!envPassword) {
      return NextResponse.json({ ok: false, error: '密码未配置' }, { status: 500 })
    }
    if (!input) {
      return NextResponse.json({ ok: false, error: '请输入密码' }, { status: 400 })
    }
    if (input !== envPassword) {
      return NextResponse.json({ ok: false, error: '密码错误' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true, token: 'yes' })
    // HttpOnly cookie（服务端验证）
    res.cookies.set('app_access', 'yes', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    // 非 HttpOnly cookie（移动端兜底）
    res.cookies.set('app_access_client', 'yes', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '未知错误'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
