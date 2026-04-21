import { useState } from 'react'
import { X, Pin, Users, FileText } from 'lucide-react'
import { formatTime } from './MessageBubble'

const TABS = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'pinned',  label: 'Pinned',  icon: Pin },
  { id: 'files',   label: 'Files',   icon: FileText },
]

function TabBtn({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button
      onClick={() => onClick(tab.id)}
      className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition-colors"
      style={{
        borderColor: active ? 'var(--pri)' : 'transparent',
        color: active ? 'var(--pri)' : 'var(--mut)',
      }}
    >
      <Icon size={13} />
      {tab.label}
    </button>
  )
}

export default function ChatInfoPanel({ activeConv, contacts, messages, onClose }) {
  const [tab, setTab] = useState('members')

  const isChannel = Boolean(activeConv?.name)
  const pinnedMsgs = messages.filter(m => m.is_pinned)

  // For channels: show all contacts; for DMs: show both participants
  const members = isChannel
    ? contacts
    : activeConv?.contact ? [activeConv.contact] : []

  return (
    <div
      className="w-[260px] flex-shrink-0 flex flex-col h-full overflow-hidden border-l"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
    >
      {/* Header */}
      <div
        className="h-[54px] flex items-center justify-between px-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--bdr)' }}
      >
        <span className="text-[13px] font-semibold" style={{ color: 'var(--txt)' }}>
          {isChannel ? `#${activeConv?.name}` : activeConv?.contact?.name ?? 'Info'}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors"
          style={{ color: 'var(--lgt)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--bdr)' }}>
        {TABS.map(t => <TabBtn key={t.id} tab={t} active={tab === t.id} onClick={setTab} />)}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Members ─────────────────────────────────────────────────────── */}
        {tab === 'members' && (
          <div className="py-2">
            {isChannel && (
              <div className="px-4 pb-2 pt-1 text-[11px]" style={{ color: 'var(--lgt)' }}>
                {contacts.length} member{contacts.length !== 1 ? 's' : ''} in this school
              </div>
            )}
            {members.map(c => (
              <div key={c.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--bg)] transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 av-${c.avColor}`}>
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate" style={{ color: 'var(--txt)' }}>{c.name}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--lgt)' }}>{c.roleLabel}</div>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <p className="px-4 py-4 text-[12px]" style={{ color: 'var(--lgt)' }}>No members to display.</p>
            )}
          </div>
        )}

        {/* ── Pinned messages ─────────────────────────────────────────────── */}
        {tab === 'pinned' && (
          <div className="py-2">
            {pinnedMsgs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Pin size={20} className="mx-auto mb-2 opacity-30" />
                <p className="text-[12px]" style={{ color: 'var(--lgt)' }}>No pinned messages yet.</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--lgt)' }}>
                  Hover a message → ··· → Pin message
                </p>
              </div>
            ) : (
              pinnedMsgs.map(m => (
                <div
                  key={m.id}
                  className="mx-3 my-1.5 p-3 rounded-[8px] border"
                  style={{ borderColor: 'var(--bdr)', background: 'var(--bg)' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold av-${m.sender?.avColor}`}>
                      {m.sender?.initials}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--txt)' }}>{m.sender?.name}</span>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--lgt)' }}>{formatTime(m.created_at)}</span>
                  </div>
                  <p className="text-[12px] line-clamp-3" style={{ color: 'var(--txt)' }}>{m.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Files ────────────────────────────────────────────────────────── */}
        {tab === 'files' && (
          <div className="py-4 px-4 text-center">
            <FileText size={20} className="mx-auto mb-2 opacity-30" />
            <p className="text-[12px]" style={{ color: 'var(--lgt)' }}>File sharing coming soon.</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--lgt)' }}>
              Use the 📎 attach button in the composer to share files.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
