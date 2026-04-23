import { Hash, Lock, Phone, Video, Search, Pin, Users, Info, ArrowLeft } from 'lucide-react'

function ActionBtn({ icon: Icon, title, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-[7px] flex items-center justify-center transition-colors"
      style={{ background: active ? 'rgba(26,58,92,0.08)' : 'transparent', color: active ? 'var(--pri)' : 'var(--mut)' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={15} />
    </button>
  )
}

export default function ChatHeader({ activeConv, onToggleInfo, infoPanelOpen, onToggleSearch, searchOpen, onBack, onVoiceCall, onVideoCall }) {
  if (!activeConv) return (
    <div className="h-[54px] flex-shrink-0 border-b flex items-center px-4" style={{ borderColor: 'var(--bdr)' }}>
      <span className="text-[13px]" style={{ color: 'var(--lgt)' }}>Select a conversation to start messaging</span>
    </div>
  )

  const isChannel = Boolean(activeConv.name)
  const contact = activeConv.contact

  return (
    <div
      className="h-[54px] flex-shrink-0 border-b flex items-center gap-2 px-3 md:px-4"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
    >
      {/* Back button — mobile only */}
      <button
        onClick={onBack}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-[7px] flex-shrink-0 transition-colors"
        style={{ color: 'var(--mut)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <ArrowLeft size={17} />
      </button>

      {/* Identity */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isChannel ? (
          <>
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(26,58,92,0.08)' }}
            >
              {activeConv.is_readonly
                ? <Lock size={13} style={{ color: 'var(--pri)' }} />
                : <Hash size={13} style={{ color: 'var(--pri)' }} />
              }
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold leading-tight" style={{ color: 'var(--txt)' }}>
                {activeConv.name}
              </div>
              {activeConv.description && (
                <div className="text-[11px] truncate" style={{ color: 'var(--lgt)' }}>
                  {activeConv.description}
                  {activeConv.memberCount ? ` · ${activeConv.memberCount} members` : ''}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 av-${contact?.avColor}`}>
              {contact?.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold leading-tight" style={{ color: 'var(--txt)' }}>
                {contact?.name}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--lgt)' }}>
                {contact?.roleLabel}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <ActionBtn icon={Search} title="Search in conversation" onClick={onToggleSearch} active={searchOpen} />
        <ActionBtn icon={Pin} title="Pinned messages" onClick={onToggleInfo} active={infoPanelOpen} />
        {!isChannel && (
          <>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--bdr)' }} />
            <ActionBtn icon={Phone} title="Voice call" onClick={onVoiceCall} />
            <ActionBtn icon={Video} title="Video call" onClick={onVideoCall} />
          </>
        )}
        {isChannel && <ActionBtn icon={Users} title="Members" onClick={onToggleInfo} active={infoPanelOpen} />}
        <div className="w-px h-4 mx-1" style={{ background: 'var(--bdr)' }} />
        <ActionBtn icon={Info} title="Conversation info" onClick={onToggleInfo} active={infoPanelOpen} />
      </div>
    </div>
  )
}
