export default function StatCard({ label, value, sub, upText, downText }) {
  return (
    <div
      className="rounded-[10px] p-4 border"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}
    >
      <div
        className="text-[10px] uppercase tracking-[0.3px] mb-1.5"
        style={{ color: 'var(--mut)' }}
      >
        {label}
      </div>
      <div className="font-syne text-2xl font-semibold leading-none">{value}</div>
      {(sub || upText || downText) && (
        <div className="text-[11px] mt-1.5" style={{ color: 'var(--mut)' }}>
          {upText && <span className="font-medium" style={{ color: 'var(--teal)' }}>{upText} </span>}
          {downText && <span className="font-medium" style={{ color: 'var(--red)' }}>{downText} </span>}
          {sub}
        </div>
      )}
    </div>
  )
}
