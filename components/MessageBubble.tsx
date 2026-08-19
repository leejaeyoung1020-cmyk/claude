function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}

/** 채팅 메시지 한 줄. 내 메시지는 오른쪽, 상대 메시지는 왼쪽에 붙는다 */
export default function MessageBubble({
  body,
  createdAt,
  isMine,
}: {
  body: string
  createdAt: string
  isMine: boolean
}) {
  return (
    <div data-mine={isMine} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
        <p
          className={
            isMine
              ? 'max-w-xs whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-sm text-white'
              : 'max-w-xs whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200'
          }
        >
          {body}
        </p>
        <span className="shrink-0 text-[11px] text-slate-400">{formatTime(createdAt)}</span>
      </div>
    </div>
  )
}
