'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { pendingReceivedRequestCount } from '@/lib/mock/api'

const LINKS = [
  { href: '/search', label: '검색' },
  { href: '/requests', label: '신청함' },
  { href: '/me', label: '내 프로필' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [pending, setPending] = useState(0)

  useEffect(() => {
    setPending(pendingReceivedRequestCount())
  }, [pathname])

  return (
    <nav className="mx-auto flex max-w-2xl gap-1 px-6 pt-6 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            pathname === link.href
              ? 'rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white'
              : 'rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100'
          }
        >
          {link.label === '신청함' && pending > 0 ? `신청함 (${pending})` : link.label}
        </Link>
      ))}
    </nav>
  )
}
