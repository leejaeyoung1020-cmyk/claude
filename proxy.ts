import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 인증 없이 볼 수 있는 경로. 그 외 모든 화면은 로그인해야 보인다 (SPEC 4.1).
const PUBLIC_PATHS = ['/', '/login', '/suspended']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname)
}

// Next.js 16 부터 middleware.ts 는 proxy.ts 로 이름이 바뀌었다.
// plan.md 와 tasks.md 의 "middleware.ts" 는 이 파일을 가리킨다.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // 환경 변수가 없으면(=아직 Supabase 연결 전) 통과시킨다.
  // 이렇게 해두면 .env.local 없이도 화면을 열어 볼 수 있다.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 1. 로그인하지 않았다 → 공개 경로만 허용
  if (!user) {
    if (isPublic(path)) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, suspended_until')
    .eq('id', user.id)
    .maybeSingle()

  // 2. 정지 중이다 → 정지 안내 화면으로 (SPEC 4.5)
  const suspended =
    profile?.suspended_until && new Date(profile.suspended_until).getTime() > Date.now()
  if (suspended) {
    if (path === '/suspended') return response
    return NextResponse.redirect(new URL('/suspended', request.url))
  }

  // 3. 프로필이 없다 → 온보딩으로
  if (!profile) {
    if (path === '/onboarding') return response
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // 4. 로그인·프로필 완료 상태에서 로그인 화면에 오면 검색으로 보낸다
  if (path === '/login' || path === '/onboarding' || path === '/suspended') {
    return NextResponse.redirect(new URL('/search', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // 정적 파일과 이미지 요청은 건너뛴다
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
