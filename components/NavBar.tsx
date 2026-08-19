'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { pendingReceivedRequestCount } from '@/lib/mock/api'
import { getCurrentProfile } from '@/lib/mock/auth'
import { STORAGE_KEY } from '@/lib/mock/store'

const LINKS = [
  { href: '/search', label: '검색' },
  { href: '/requests', label: '신청함' },
  { href: '/chat', label: '채팅' },
  { href: '/me', label: '내 프로필' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [pending, setPending] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  function refresh() {
    setPending(pendingReceivedRequestCount())
    setIsAdmin(Boolean(getCurrentProfile()?.is_admin))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const links = isAdmin ? [...LINKS, { href: '/admin', label: '관리자' }] : LINKS

  return (
    <nav className="mx-auto flex max-w-2xl gap-1 px-6 pt-6 text-sm">
      {links.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white'
                : 'rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100'
            }
          >
            {link.label === '신청함' && pending > 0 ? `신청함 (${pending})` : link.label}
          </Link>
        )
      })}
    </nav>
  )
}
