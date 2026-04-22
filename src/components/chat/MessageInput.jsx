import { useState, useRef, useEffect } from 'react'
import { Send, Smile, Paperclip, Bold, Italic, Code, X, CornerDownRight, Lock } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

function FmtBtn({ icon: Icon, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      type="button"
      className="w-6 h-6 rounded flex items-center justify-center transition-colors text-[11px] font-bold"
      style={{ color: 'var(--mut)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bdr)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={12} />
    </button>
  )
}

export default function MessageInput({ onSend, replyTo, onCancelReply, convName, readonly }) {
  const [text, setText]           = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef               = useRef(null)
  const pickerRef                 = useRef(null)

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return
    const h = (e) => { if (!pickerRef.current?.contains(e.target)) setShowEmoji(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showEmoji])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }, [text])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    setShowEmoji(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function insertFormat(marker) {
    const ta    = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = text.slice(start, end) || 'text'
    const next  = text.slice(0, start) + marker + sel + marker + text.slice(end)
    setText(next)
    setTimeout(() => {
      ta.setSelectionRange(start + marker.length, start + marker.length + sel.length)
      ta.focus()
    }, 0)
  }

  function insertEmoji(emoji) {
    const ta    = textareaRef.current
    const start = ta?.selectionStart ?? text.length
    setText(prev => prev.slice(0, start) + emoji + prev.slice(start))
    setShowEmoji(false)
    setTimeout(() => {
      if (ta) { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus() }
    }, 0)
  }

  // ── Readonly channel ──────────────────────────────────────────────────────────
  if (readonly) return (
    <div
      className="px-4 py-3.5 border-t flex items-center justify-center gap-2"
      style={{ borderColor: 'var(--bdr)', background: 'var(--bg)' }}
    >
      <Lock size={13} style={{ color: 'var(--lgt)' }} />
      <span className="text-[12px]" style={{ color: 'var(--lgt)' }}>
        This channel is read-only. Only administrators can post here.
      </span>
    </div>
  )

  const canSend = text.trim().length > 0
  const placeholder = convName ? `Message #${convName}…` : 'Type a message…'

  return (
    <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--bdr)' }}>

      {/* Reply preview */}
      {replyTo && (
        <div
          className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-[7px]"
          style={{ background: 'rgba(232,124,62,0.08)', border: '1px solid rgba(232,124,62,0.2)' }}
        >
          <CornerDownRight size={11} style={{ color: 'var(--acc)', flexShrink: 0 }} />
          <span className="text-[11.5px] font-medium flex-shrink-0" style={{ color: 'var(--acc)' }}>
            Replying to {replyTo.sender?.name ?? 'message'}
          </span>
          <span className="text-[11.5px] truncate flex-1" style={{ color: 'var(--mut)' }}>
            {replyTo.content}
          </span>
          <button onClick={onCancelReply} className="ml-1 flex-shrink-0 hover:opacity-70">
            <X size={12} style={{ color: 'var(--mut)' }} />
          </button>
        </div>
      )}

      {/* Composer box */}
      <div
        className="flex flex-col rounded-[10px] border transition-all"
        style={{ borderColor: 'var(--bdr)' }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--pri)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--bdr)'}
      >
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 px-2.5 pt-2 pb-1 border-b rounded-t-[10px] overflow-hidden" style={{ borderColor: 'var(--bdr)' }}>
          <FmtBtn icon={Bold}   title="Bold (wrap in **)"    onClick={() => insertFormat('**')} />
          <FmtBtn icon={Italic} title="Italic (wrap in _)"   onClick={() => insertFormat('_')} />
          <FmtBtn icon={Code}   title="Inline code (wrap in `)" onClick={() => insertFormat('`')} />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="px-3 py-2 text-[13.5px] bg-transparent resize-none outline-none"
          style={{ color: 'var(--txt)', minHeight: 40, maxHeight: 130 }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
          <div className="flex items-center gap-0.5">

            {/* Emoji picker */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowEmoji(v => !v)}
                title="Emoji"
                className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors"
                style={{ color: showEmoji ? 'var(--acc)' : 'var(--mut)' }}
                onMouseEnter={e => { if (!showEmoji) e.currentTarget.style.background = 'var(--bg)' }}
                onMouseLeave={e => { if (!showEmoji) e.currentTarget.style.background = 'transparent' }}
              >
                <Smile size={15} />
              </button>
              {showEmoji && (
                <div className="absolute bottom-10 left-0 z-[200] shadow-xl rounded-[12px] overflow-hidden">
                  <Picker
                    data={data}
                    onEmojiSelect={e => insertEmoji(e.native)}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                    maxFrequentRows={1}
                    perLine={8}
                  />
                </div>
              )}
            </div>

            {/* Attach — placeholder, no upload yet */}
            <button
              type="button"
              title="Attach file (coming soon)"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors"
              style={{ color: 'var(--mut)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Paperclip size={14} />
            </button>
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
            style={{
              background: canSend ? 'var(--pri)' : 'var(--bdr)',
              color:      canSend ? 'white'      : 'var(--lgt)',
              cursor:     canSend ? 'pointer'    : 'default',
            }}
          >
            <Send size={11} />
            Send
          </button>
        </div>
      </div>

      <div className="mt-1.5 text-center text-[10px]" style={{ color: 'var(--lgt)' }}>
        <kbd className="px-1 rounded" style={{ background: 'var(--bdr)' }}>Enter</kbd> to send ·{' '}
        <kbd className="px-1 rounded" style={{ background: 'var(--bdr)' }}>Shift+Enter</kbd> for new line
      </div>
    </div>
  )
}
