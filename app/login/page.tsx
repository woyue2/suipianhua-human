'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/auth/AuthProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(true) // 默认记住登录
  const { signIn, signUp, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || '/'

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setNotice('注册成功，请查收邮件验证')
        setIsSignUp(false)
      } else {
        await signIn(email, password)

        // 如果选择记住登录，保存到 localStorage
        if (rememberMe && email) {
          localStorage.setItem('remembered-email', email)
        } else {
          localStorage.removeItem('remembered-email')
        }

        router.replace(redirectTo)
      }
    } catch (err) {
      setError((err as { message?: string })?.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">
          {isSignUp ? '注册' : '登录'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          {!isSignUp && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                记住登录状态（30天免登录）
              </label>
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {notice && <div className="text-blue-600 text-sm">{notice}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? '处理中...' : isSignUp ? '注册' : '登录'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          disabled={submitting}
          className="w-full text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? '已有账号？登录' : '没有账号？注册'}
        </button>
      </div>
    </div>
  )
}
