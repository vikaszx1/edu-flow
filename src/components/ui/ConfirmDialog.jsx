import { AlertTriangle, Trash2, ShieldOff } from 'lucide-react'
import useStore from '../../store/useStore'

const VARIANT_CONFIG = {
  danger:  { icon: Trash2,        iconBg: '#fcebeb', iconColor: 'var(--red)',  btnBg: 'var(--red)',  btnText: 'white' },
  warning: { icon: ShieldOff,     iconBg: '#faeeda', iconColor: 'var(--amb)',  btnBg: 'var(--amb)',  btnText: 'white' },
  info:    { icon: AlertTriangle, iconBg: '#e6f1fb', iconColor: '#185fa5',     btnBg: 'var(--pri)',  btnText: 'white' },
}

export default function ConfirmDialog() {
  const confirmState = useStore(s => s.confirmState)
  if (!confirmState?.open) return null

  const { title, message, variant = 'danger', confirmLabel, onConfirm, onCancel } = confirmState
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger
  const Icon = cfg.icon

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div
        className="rounded-[14px] border w-full max-w-[380px] p-6"
        style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.iconBg }}
          >
            <Icon size={17} style={{ color: cfg.iconColor }} />
          </div>
          <div>
            <div className="font-syne text-[15px] font-semibold">{title}</div>
            <div className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--mut)' }}>{message}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-[7px] text-[13px] border"
            style={{ borderColor: 'var(--bdr)', color: 'var(--mut)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-[7px] text-[13px] font-medium"
            style={{ background: cfg.btnBg, color: cfg.btnText }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
