/**
 * 사진이 있으면 사진을, 없으면 닉네임 첫 글자와 seed 기반 배경색을 보여준다.
 * seed(보통 프로필 id)로 같은 사람은 항상 같은 색이 나오게 한다.
 */
const PALETTE = ['#1e3a8a', '#2563eb', '#3b82f6', '#0d9488', '#7c3aed', '#c2410c', '#0f766e', '#be185d']

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const

function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export default function Avatar({
  photoUrl,
  nickname,
  seed,
  size = 'md',
}: {
  photoUrl: string | null
  nickname: string
  seed: string
  size?: keyof typeof SIZE_CLASS
}) {
  const sizeClass = SIZE_CLASS[size]

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${nickname} 프로필 사진`}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: colorFor(seed) }}
      aria-label={`${nickname} 기본 아바타`}
    >
      {nickname.slice(0, 1) || '?'}
    </div>
  )
}
