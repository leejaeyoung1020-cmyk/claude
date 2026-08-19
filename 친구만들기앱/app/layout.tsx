import type { Metadata } from 'next'
import './globals.css'

// [확인 필요] 앱 이름이 정해지면 title 과 아래 APP_NAME 을 함께 바꾼다.
export const APP_NAME = '친구만들기앱'

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
