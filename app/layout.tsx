import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/appName'
import './globals.css'

export const metadata: Metadata = {
  title: `${APP_NAME} · 경기대학교`,
  description: '경기대학교 안에서 같이 뭔가 할 사람을 찾는 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
