import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import useStore from '../../store/useStore'

const CONFIG = {
  success: { icon: CheckCircle2, bg: '#e1f5ee', border: '#9fe1cb', iconColor: 'var(--teal)',  textColor: '#0f6e56' },
  error:   { icon: XCircle,      bg: '#fcebeb', border: '#f0b8b8', iconColor: 'var(--red)',   textColor: '#a32d2d' },
  warning: { icon: AlertTriangle,bg: '#faeeda', border: '#f5cfa0', iconColor: 'var(--amb)',   textColor: '#854f0b' },
  info:    { icon: Info,         bg: '#e6f1fb', border: '#b3d4f5', iconColor: '#185fa5',      textColor: '#185fa5' },
}

function ToastItem({ toast }) {
  const removeToast = useStore(s => s.removeToast)
  const cfg = CONFIG[toast.type] || CONFIG.info
  const Icon = cfg.icon

  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 rounded-[10px] border shadow-sm min-w-[280px] max-w-[360px]"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <Icon size={15} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }} />
      <span className="flex-1 text-[12px] font-medium leading-snug" style={{ color: cfg.textColor }}>
        {toast.message}
      </span>
      <button
        onClick={() => removeToast(toast.id)}
        style={{ color: cfg.iconColor, opacity: 0.6, flexShrink: 0 }}
        className="hover:opacity-100 transition-opacity"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts)
  if (!toasts.length) return null

  return (
    <div
      className="fixed z-[100] flex flex-col gap-2"
      style={{ bottom: 24, right: 24 }}
    >
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
