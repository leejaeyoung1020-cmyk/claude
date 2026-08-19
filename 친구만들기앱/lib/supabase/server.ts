import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/**
 * 서버 컴포넌트·서버 액션용 Supabase 클라이언트.
 *
 * 서버 컴포넌트에서는 쿠키를 쓸 수 없어 setAll 이 예외를 던진다.
 * 세션 갱신은 middleware 가 담당하므로 여기서는 조용히 넘긴다.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // 서버 컴포넌트에서 호출된 경우. middleware 가 갱신을 맡는다.
          }
        },
      },
    },
  )
}
