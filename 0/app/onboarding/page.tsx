import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'
import type { Tag } from '@/lib/types'
import OnboardingForm from './OnboardingForm'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  let tags: Tag[] = []

  if (hasSupabaseEnv()) {
    const supabase = await createClient()
    const { data } = await supabase.from('interest_tags').select('id, label').order('id')
    tags = (data as Tag[]) ?? []
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-900">프로필 만들기</h1>
      <p className="mt-2 text-sm text-slate-600">
        관심사 태그가 이 앱의 첫인상이에요. 사진보다 태그를 먼저 봅니다.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {tags.length === 0 ? (
          <p className="text-sm text-slate-500">
            관심사 태그를 불러오지 못했습니다. <code>supabase/seed.sql</code> 을 실행했는지
            확인해 주세요.
          </p>
        ) : (
          <OnboardingForm tags={tags} />
        )}
      </div>
    </main>
  )
}
