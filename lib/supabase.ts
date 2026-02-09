import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
  auth: {
    persistSession: true,        // 持久化 session 到 localStorage
    autoRefreshToken: true,      // 自动刷新 token
    detectSessionInUrl: true,    // 从 URL 检测 session（OAuth 回调）
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token', // localStorage key
  },
})

