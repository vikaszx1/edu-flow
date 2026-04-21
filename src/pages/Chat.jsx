import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import useChat from '../hooks/useChat'
import useStore from '../store/useStore'
import ChatSidebar   from '../components/chat/ChatSidebar'
import ChatHeader    from '../components/chat/ChatHeader'
import MessageList   from '../components/chat/MessageList'
import MessageInput  from '../components/chat/MessageInput'
import ChatInfoPanel from '../components/chat/ChatInfoPanel'

function LoadingPane() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--surf)' }}>
      <div className="w-7 h-7 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--pri)', borderTopColor: 'transparent' }} />
      <span className="text-[12px]" style={{ color: 'var(--lgt)' }}>Loading messages…</span>
    </div>
  )
}

function WelcomePlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--surf)' }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(26,58,92,0.07)' }}
      >
        <MessageSquare size={28} style={{ color: 'var(--pri)' }} />
      </div>
      <div className="text-center">
        <div className="text-[15px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>
          Select a conversation
        </div>
        <div className="text-[12px]" style={{ color: 'var(--lgt)' }}>
          Choose a channel or direct message from the left panel.
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const { userId, pendingDmUserId, setPendingDmUserId } = useStore()
  const {
    contacts, channels, dms, messages,
    activeConvId, activeConv,
    loading, msgsLoading,
    selectConv, sendMessage, editMessage, deleteMessage,
    toggleReaction, pinMessage, startDm,
  } = useChat()

  // Auto-open DM when navigated from another page (Students/Staff profile)
  useEffect(() => {
    if (!pendingDmUserId || loading) return
    startDm(pendingDmUserId)
    setPendingDmUserId(null)
  }, [pendingDmUserId, loading])

  const [replyTo, setReplyTo]         = useState(null)
  const [infoPanelOpen, setInfoPanel] = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)

  async function handleSend(content) {
    await sendMessage(content, replyTo?.id ?? null)
    setReplyTo(null)
  }

  const activeIsReadonly = Boolean(activeConv?.is_readonly)

  if (loading) return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--surf)' }}>
      <div className="w-[248px] flex-shrink-0 border-r" style={{ borderColor: 'var(--bdr)' }} />
      <LoadingPane />
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--surf)' }}>

      {/* ── Left: channel + DM list ──────────────────────────────────────── */}
      <ChatSidebar
        channels={channels}
        dms={dms}
        contacts={contacts}
        activeConvId={activeConvId}
        onSelectConv={selectConv}
        onStartDm={startDm}
      />

      {/* ── Middle: message area ─────────────────────────────────────────── */}
      {!activeConvId ? (
        <WelcomePlaceholder />
      ) : (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--surf)' }}>
          <ChatHeader
            activeConv={activeConv}
            infoPanelOpen={infoPanelOpen}
            onToggleInfo={() => setInfoPanel(v => !v)}
            searchOpen={searchOpen}
            onToggleSearch={() => setSearchOpen(v => !v)}
          />

          <MessageList
            messages={messages}
            loading={msgsLoading}
            activeConv={activeConv}
            userId={userId}
            contacts={contacts}
            onReact={toggleReaction}
            onReply={setReplyTo}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onPin={pinMessage}
          />

          <MessageInput
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            convName={activeConv?.name ?? null}
            readonly={activeIsReadonly}
          />
        </div>
      )}

      {/* ── Right: info panel ────────────────────────────────────────────── */}
      {infoPanelOpen && activeConv && (
        <ChatInfoPanel
          activeConv={activeConv}
          contacts={contacts}
          messages={messages}
          onClose={() => setInfoPanel(false)}
        />
      )}
    </div>
  )
}
