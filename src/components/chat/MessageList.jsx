import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

// ── Date separator ─────────────────────────────────────────────────────────────
function getDateLabel(ts) {
  const d   = new Date(ts)
  const now = new Date()
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const msgDay    = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (msgDay.getTime() === today.getTime())     return 'Today'
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 h-px" style={{ background: 'var(--bdr)' }} />
      <span className="text-[11px] font-medium px-2" style={{ color: 'var(--lgt)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--bdr)' }} />
    </div>
  )
}

function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--lgt)', animation: 'typingBounce 1.2s ease infinite', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-[11.5px]" style={{ color: 'var(--lgt)' }}>
        <strong style={{ color: 'var(--mut)', fontWeight: 500 }}>{name}</strong> is typing…
      </span>
    </div>
  )
}

function EmptyState({ conv }) {
  const isChannel = Boolean(conv?.name)
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-[24px]"
        style={{ background: 'rgba(26,58,92,0.07)' }}
      >
        {isChannel ? '#' : '💬'}
      </div>
      <div>
        <div className="text-[14px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>
          {isChannel ? `Welcome to #${conv?.name}` : `Chat with ${conv?.contact?.name}`}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--lgt)' }}>
          {isChannel
            ? (conv?.description || 'Start the conversation.')
            : 'Send a message to get started.'}
        </div>
      </div>
    </div>
  )
}

// ── Should group with previous message ─────────────────────────────────────────
function shouldGroup(msg, prev) {
  if (!prev) return false
  if (msg.sender_id !== prev.sender_id) return false
  if (msg.reply_to_id) return false
  return new Date(msg.created_at) - new Date(prev.created_at) < 5 * 60 * 1000
}

// ── MessageList ────────────────────────────────────────────────────────────────
export default function MessageList({
  messages, loading, activeConv, userId, contacts,
  onReact, onReply, onEdit, onDelete, onPin,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!messages.length) return (
    <div className="flex-1">
      <EmptyState conv={activeConv} />
    </div>
  )

  // Build render list with date separators
  const items = []
  let lastDateLabel = null

  messages.forEach((msg, i) => {
    const dateLabel = getDateLabel(msg.created_at)
    if (dateLabel !== lastDateLabel) {
      items.push({ type: 'date', label: dateLabel, key: `date-${i}` })
      lastDateLabel = dateLabel
    }
    const prev = messages[i - 1]
    const prevDateLabel = prev ? getDateLabel(prev.created_at) : null
    const grouped = prevDateLabel === dateLabel && shouldGroup(msg, prev)
    items.push({ type: 'msg', msg, grouped, key: msg.id })
  })

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {items.map(item =>
        item.type === 'date'
          ? <DateSeparator key={item.key} label={item.label} />
          : (
            <MessageBubble
              key={item.key}
              msg={item.msg}
              isOwn={item.msg.sender_id === userId}
              showMeta={!item.grouped}
              userId={userId}
              contacts={contacts}
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          )
      )}

      {/* Static typing indicator — only for DM views to feel alive */}
      {activeConv && !activeConv.name && messages.length > 0 && false && (
        <TypingIndicator name={activeConv.contact?.name} />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
