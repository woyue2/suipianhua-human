import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import AuthProvider from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'sniipet-huamn 碎片化人类',
  description: '基于 Next.js 的 AI 智能大纲整理工具',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "碎片化人类",
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <RequireAuth>{children}</RequireAuth>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
