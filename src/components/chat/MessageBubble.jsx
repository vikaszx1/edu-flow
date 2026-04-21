import { useState, useRef, useEffect } from 'react'
import { CornerDownRight, MoreHorizontal, Pencil, Trash2, Pin, Copy, Star, Check, X } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥']

function MenuItem({ icon: Icon, label, onClick, destructive }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors"
      style={{ color: destructive ? 'var(--red)' : 'var(--txt)' }}
      onMouseEnter={e => e.currentTarget.style.background = destructive ? '#fff0f0' : 'var(--bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={13} style={{ flexShrink: 0 }} />
      {label}
    </button>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
export default function MessageBubble({
  msg, isOwn, showMeta, userId, contacts,
  onReact, onReply, onEdit, onDelete, onPin,
}) {
  const [hovered, setHovered]         = useState(false)
  const [showMenu, setShowMenu]       = useState(false)
  const [editing, setEditing]         = useState(false)
  const [editText, setEditText]       = useState(msg.content)
  const menuRef                       = useRef(null)
  const editRef                       = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showMenu])

  // Focus edit textarea
  useEffect(() => {
    if (editing) { editRef.current?.focus(); editRef.current?.select() }
  }, [editing])

  const sender = msg.sender
  const replyToSenderName = msg.reply_to?.reply_sender?.name || 'Unknown'

  function handleSaveEdit() {
    if (editText.trim() && editText.trim() !== msg.content) onEdit(msg.id, editText.trim())
    setEditing(false)
  }

  return (
    <div
      className="group relative flex gap-2.5 px-4 rounded-[6px] transition-colors"
      style={{
        paddingTop: showMeta ? 10 : 2,
        paddingBottom: 2,
        background: hovered ? 'rgba(0,0,0,0.025)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false) }}
    >
      {/* Avatar column — 32px wide always */}
      <div className="w-8 flex-shrink-0 pt-px">
        {showMeta && sender && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold av-${sender.avColor}`}>
            {sender.initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Meta: name + timestamp */}
        {showMeta && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--txt)' }}>
              {isOwn ? 'You' : sender?.name ?? 'Unknown'}
            </span>
            <span className="text-[10.5px]" style={{ color: 'var(--lgt)' }}>
              {formatTime(msg.created_at)}
            </span>
            {msg.is_edited && (
              <span className="text-[10px]" style={{ color: 'var(--lgt)' }}>(edited)</span>
            )}
            {msg.is_pinned && (
              <span className="text-[10px] font-medium" style={{ color: 'var(--acc)' }}>📌 pinned</span>
            )}
          </div>
        )}

        {/* Reply preview */}
        {msg.reply_to && (
          <div
            className="flex items-start gap-1.5 mb-1.5 pl-2.5 py-0.5 rounded-r text-[11.5px]"
            style={{ borderLeft: '2px solid var(--acc)' }}
          >
            <span className="font-semibold truncate max-w-[100px]" style={{ color: 'var(--acc)', flexShrink: 0 }}>
              {replyToSenderName}
            </span>
            <span className="truncate" style={{ color: 'var(--mut)' }}>
              {msg.reply_to.content}
            </span>
          </div>
        )}

        {/* Message text or inline editor */}
        {editing ? (
          <div className="mt-0.5">
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() }
                if (e.key === 'Escape') { setEditing(false); setEditText(msg.content) }
              }}
              rows={2}
              className="w-full px-3 py-2 text-[13.5px] rounded-[8px] resize-none outline-none border"
              style={{ borderColor: 'var(--pri)', color: 'var(--txt)', background: 'var(--surf)' }}
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-white transition-colors"
                style={{ background: 'var(--pri)' }}
              >
                <Check size={11} /> Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(msg.content) }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-colors"
                style={{ color: 'var(--mut)' }}
              >
                <X size={11} /> Cancel
              </button>
              <span className="text-[10px]" style={{ color: 'var(--lgt)' }}>Esc to cancel · Enter to save</span>
            </div>
          </div>
        ) : (
          <p className="text-[13.5px] leading-[1.55] break-words whitespace-pre-wrap" style={{ color: 'var(--txt)' }}>
            {msg.content}
          </p>
        )}

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {msg.reactions.map((r, i) => {
              const reacted = r.user_ids?.includes(userId)
              return (
                <button
                  key={i}
                  onClick={() => onReact(msg.id, r.emoji)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[12px] border transition-all"
                  style={{
                    background:     reacted ? 'rgba(26,58,92,0.08)' : 'var(--surf)',
                    borderColor:    reacted ? 'var(--pri)' : 'var(--bdr)',
                    color:          reacted ? 'var(--pri)' : 'var(--txt)',
                    fontWeight:     reacted ? 600 : 400,
                  }}
                >
                  {r.emoji}
                  <span className="text-[10.5px]">{r.user_ids?.length}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Hover action bar */}
      {hovered && !editing && (
        <div
          className="absolute right-3 flex items-center gap-0.5 bg-white border rounded-[8px] shadow-sm px-1 py-0.5 z-10"
          style={{ top: -16, borderColor: 'var(--bdr)' }}
        >
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(msg.id, emoji)}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[14px] transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-4 mx-0.5" style={{ background: 'var(--bdr)' }} />
          <button
            onClick={() => onReply(msg)}
            title="Reply"
            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <CornerDownRight size={13} style={{ color: 'var(--mut)' }} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              title="More actions"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MoreHorizontal size={13} style={{ color: 'var(--mut)' }} />
            </button>

            {/* Context menu */}
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-8 bg-white border rounded-[10px] shadow-lg py-1 z-20"
                style={{ borderColor: 'var(--bdr)', minWidth: 168 }}
              >
                <MenuItem icon={CornerDownRight} label="Reply" onClick={() => { onReply(msg); setShowMenu(false) }} />
                <MenuItem icon={Pin} label={msg.is_pinned ? 'Unpin' : 'Pin message'} onClick={() => { onPin(msg.id, !msg.is_pinned); setShowMenu(false) }} />
                <MenuItem icon={Copy} label="Copy text" onClick={() => { navigator.clipboard?.writeText(msg.content); setShowMenu(false) }} />
                {isOwn && (
                  <>
                    <div className="h-px my-1" style={{ background: 'var(--bdr)' }} />
                    <MenuItem icon={Pencil} label="Edit message" onClick={() => { setEditing(true); setShowMenu(false) }} />
                    <MenuItem icon={Trash2} label="Delete message" onClick={() => { onDelete(msg.id); setShowMenu(false) }} destructive />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
