export function Card({ children, className = '', style: extraStyle }) {
  return (
    <div
      className={`rounded-[11px] overflow-hidden border mb-[18px] ${className}`}
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)', ...extraStyle }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, action, onAction, children }) {
  return (
    <div
      className="px-4 py-3.5 flex items-center justify-between border-b"
      style={{ borderColor: 'var(--bdr)' }}
    >
      <span className="font-syne text-[13px] font-semibold">{title}</span>
      {action && (
        <span className="text-[11px] font-medium cursor-pointer" style={{ color: 'var(--pri)' }}
          onClick={onAction}>
          {action}
        </span>
      )}
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
