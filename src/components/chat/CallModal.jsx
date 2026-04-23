import { useEffect, useRef, useState } from 'react'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { X, Phone, Video } from 'lucide-react'

const APP_ID     = Number(import.meta.env.VITE_ZEGO_APP_ID)
const APP_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET

// Deterministic room ID for a 1-on-1 call — same for both participants
function getRoomId(uid1, uid2) {
  return [uid1, uid2].sort().join('_').replace(/-/g, '').slice(0, 36)
}

export default function CallModal({ contact, callType, userId, userName, onClose }) {
  const containerRef = useRef(null)
  const zpRef        = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (!APP_ID || APP_SECRET === 'your_server_secret_here') {
      setError('ZEGOCLOUD credentials are not configured. Add VITE_ZEGO_APP_ID and VITE_ZEGO_SERVER_SECRET to your .env file.')
      return
    }

    const roomID  = getRoomId(userId, contact.id)
    const token   = ZegoUIKitPrebuilt.generateKitTokenForTest(APP_ID, APP_SECRET, roomID, userId, userName)
    const zp      = ZegoUIKitPrebuilt.create(token)
    zpRef.current = zp

    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      turnOnCameraWhenJoining:     callType === 'video',
      turnOnMicrophoneWhenJoining: true,
      showScreenSharingButton:     callType === 'video',
      showPreJoinView:             false,
      onLeaveRoom: () => onClose(),
    })

    return () => {
      zpRef.current?.destroy?.()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      {error ? (
        <div
          className="relative w-full max-w-md rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--surf)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--mut)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>

          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.1)' }}
          >
            {callType === 'video' ? <Video size={20} style={{ color: '#dc2626' }} /> : <Phone size={20} style={{ color: '#dc2626' }} />}
          </div>

          <div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: 'var(--txt)' }}>
              Call setup required
            </div>
            <div className="text-[12px] leading-relaxed" style={{ color: 'var(--lgt)' }}>
              {error}
            </div>
          </div>

          <a
            href="https://console.zegocloud.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] underline"
            style={{ color: 'var(--pri)' }}
          >
            Get free API keys at console.zegocloud.com →
          </a>
        </div>
      ) : (
        <div
          className="relative w-full h-full md:w-[900px] md:h-[600px] md:rounded-2xl overflow-hidden"
          style={{ background: '#000' }}
        >
          <div ref={containerRef} className="w-full h-full" />
        </div>
      )}
    </div>
  )
}
