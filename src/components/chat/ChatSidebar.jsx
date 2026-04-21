import { useState } from 'react'
import { Hash, Plus, Search, Lock, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'

function OnlineDot({ online }) {
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: online ? 'var(--teal)' : 'var(--lgt)' }}
    />
  )
}

function UnreadBadge({ count }) {
  if (!count) return null
  return (
    <span
      className="ml-auto text-[10px] font-bold px-1.5 py-px rounded-full text-white"
      style={{ background: 'var(--acc)', minWidth: 18, textAlign: 'center' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function ChatSidebar({ channels, dms, contacts, activeConvId, onSelectConv, onStartDm }) {
  const [search, setSearch] = useState('')
  const [showContacts, setShowContacts] = useState(false)
  const [chOpen, setChOpen] = useState(true)
  const [dmOpen, setDmOpen] = useState(true)

  const q = search.toLowerCase()
  const filteredChannels = channels.filter(c => c.name.includes(q))
  const filteredDms = dms.filter(d => d.contact?.name?.toLowerCase().includes(q))
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(q) && !dms.find(d => d.contact?.id === c.id)
  )

  return (
    <div
      className="w-[248px] flex-shrink-0 flex flex-col h-full overflow-hidden border-r"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--bdr)' }}>
        <div className="flex items-center gap-2">
          <MessageSquare size={15} style={{ color: 'var(--pri)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--txt)' }}>Messages</span>
        </div>
        {/* Search */}
        <div className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5 rounded-[8px]" style={{ background: 'var(--bg)', border: '1px solid var(--bdr)' }}>
          <Search size={12} style={{ color: 'var(--lgt)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: 'var(--txt)' }}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto py-1">

        {/* Channels */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => setChOpen(v => !v)}
            className="flex items-center gap-1 w-full px-2 py-1 rounded"
            style={{ color: 'var(--mut)' }}
          >
            {chOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="text-[10px] uppercase tracking-[1px] font-medium">Channels</span>
          </button>

          {chOpen && filteredChannels.map(ch => (
            <button
              key={ch.id}
              onClick={() => onSelectConv(ch.id)}
              className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-[7px] text-left transition-colors mb-px"
              style={{
                background: activeConvId === ch.id ? 'rgba(26,58,92,0.08)' : 'transparent',
                color: activeConvId === ch.id ? 'var(--pri)' : ch.unread ? 'var(--txt)' : 'var(--mut)',
                fontWeight: ch.unread ? 600 : 400,
              }}
              onMouseEnter={e => { if (activeConvId !== ch.id) e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (activeConvId !== ch.id) e.currentTarget.style.background = 'transparent' }}
            >
              {ch.is_readonly
                ? <Lock size={12} className="flex-shrink-0 opacity-60" />
                : <Hash size={12} className="flex-shrink-0 opacity-70" />
              }
              <span className="flex-1 text-[12.5px] truncate">{ch.name}</span>
              <UnreadBadge count={ch.unread} />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-4 my-1 h-px" style={{ background: 'var(--bdr)' }} />

        {/* Direct Messages */}
        <div className="px-2 pb-2">
          <div className="flex items-center gap-1 w-full px-2 py-1">
            <button onClick={() => setDmOpen(v => !v)} className="flex items-center gap-1">
              {dmOpen ? <ChevronDown size={12} style={{ color: 'var(--mut)' }} /> : <ChevronRight size={12} style={{ color: 'var(--mut)' }} />}
              <span className="text-[10px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--mut)' }}>Direct Messages</span>
            </button>
            <button
              onClick={() => setShowContacts(v => !v)}
              className="ml-auto w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--bg)] transition-colors"
              title="New message"
            >
              <Plus size={12} style={{ color: 'var(--mut)' }} />
            </button>
          </div>

          {/* New DM — contact list */}
          {showContacts && (
            <div className="mx-1 mb-2 rounded-[8px] border overflow-hidden" style={{ borderColor: 'var(--bdr)' }}>
              <div className="px-2 py-1.5 text-[10px] font-medium border-b" style={{ color: 'var(--mut)', borderColor: 'var(--bdr)', background: 'var(--bg)' }}>
                Start a new conversation
              </div>
              {filteredContacts.length === 0 && (
                <div className="px-3 py-2 text-[11px]" style={{ color: 'var(--lgt)' }}>No contacts</div>
              )}
              {filteredContacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onStartDm(c.id); setShowContacts(false) }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-[var(--bg)] transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 av-${c.avColor}`}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12px] font-medium truncate" style={{ color: 'var(--txt)' }}>{c.name}</span>
                      {c.classLabel && (
                        <span className="text-[9px] font-semibold px-1.5 py-px rounded-full flex-shrink-0 badge-blue">{c.classLabel}</span>
                      )}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--lgt)' }}>{c.roleLabel}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {dmOpen && filteredDms.map(dm => (
            <button
              key={dm.id}
              onClick={() => onSelectConv(dm.id)}
              className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-[7px] text-left transition-colors mb-px"
              style={{
                background: activeConvId === dm.id ? 'rgba(26,58,92,0.08)' : 'transparent',
              }}
              onMouseEnter={e => { if (activeConvId !== dm.id) e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (activeConvId !== dm.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 av-${dm.contact?.avColor}`}>
                {dm.contact?.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="text-[12.5px] truncate"
                    style={{
                      color: activeConvId === dm.id ? 'var(--pri)' : dm.unread ? 'var(--txt)' : 'var(--mut)',
                      fontWeight: dm.unread ? 600 : 400,
                    }}
                  >
                    {dm.contact?.name}
                  </span>
                  {dm.contact?.classLabel && (
                    <span className="text-[9px] font-semibold px-1.5 py-px rounded-full flex-shrink-0 badge-blue">
                      {dm.contact.classLabel}
                    </span>
                  )}
                </div>
                {dm.contact?.roleLabel && (
                  <div className="text-[10px] truncate" style={{ color: 'var(--lgt)' }}>
                    {dm.contact.roleLabel}
                  </div>
                )}
              </div>
              <UnreadBadge count={dm.unread} />
            </button>
          ))}

          {dmOpen && filteredDms.length === 0 && !showContacts && (
            <p className="px-4 py-2 text-[11px]" style={{ color: 'var(--lgt)' }}>
              No direct messages yet. Click + to start one.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
