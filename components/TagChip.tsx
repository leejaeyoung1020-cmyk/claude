'use client'

export default function TagChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick?: () => void
}) {
  const className = selected
    ? 'rounded-full bg-brand-600 px-3 py-1.5 text-sm text-white'
    : 'rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-900 ring-1 ring-brand-100'

  if (!onClick) {
    return (
      <span className={className}>{label}</span>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={className}>
      {label}
    </button>
  )
}
