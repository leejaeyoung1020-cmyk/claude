import Link from 'next/link'
import type { ProfileCard as ProfileCardType } from '@/lib/types'
import { ageFromBirthYear } from '@/lib/age'
import Avatar from './Avatar'
import TagChip from './TagChip'

/** 검색 결과 목록에 쓰는 카드. 클릭하면 상대 프로필로 이동한다 */
export default function ProfileCard({
  profile,
  currentYear,
}: {
  profile: ProfileCardType
  currentYear?: number
}) {
  const age = ageFromBirthYear(profile.birth_year, currentYear)

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300"
    >
      <Avatar photoUrl={profile.photo_url} nickname={profile.nickname} seed={profile.id} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{profile.nickname}</p>
        <p className="text-sm text-slate-500">
          {age}세 · {profile.department}
        </p>
        <p className="mt-1 truncate text-sm text-slate-600">{profile.bio}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.tag_labels.map((label) => (
            <TagChip key={label} label={label} selected={false} />
          ))}
        </div>
      </div>
    </Link>
  )
}
