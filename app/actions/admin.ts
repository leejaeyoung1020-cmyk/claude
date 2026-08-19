'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AdminActionState = { error: string | null }

/**
 * 신고 처리 (SPEC 4.5).
 *
 * 권한 확인은 여기서 하지 않는다. admin_resolve_report RPC 안에서
 * is_admin 을 다시 확인하므로, 화면을 우회해 이 액션을 직접 호출해도
 * 관리자가 아니면 RPC가 예외를 던진다.
 */
export async function resolveReport(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const reportedId = String(formData.get('reported_id') ?? '')
  const action = String(formData.get('action') ?? '')
  const daysRaw = formData.get('days')
  const days = daysRaw ? Number(daysRaw) : 30

  if (!reportedId) return { error: '대상을 찾을 수 없습니다' }
  if (!['dismissed', 'warned', 'suspended'].includes(action)) {
    return { error: '알 수 없는 처리입니다' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_resolve_report', {
    p_reported: reportedId,
    p_action: action,
    p_days: days,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { error: null }
}
