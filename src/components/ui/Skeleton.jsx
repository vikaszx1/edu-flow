// Base shimmer block
export default function Skeleton({ w, h, rounded = '6px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: w, height: h, borderRadius: rounded, flexShrink: 0 }}
    />
  )
}

// Mimics StatCard shape
export function SkeletonStatCard() {
  return (
    <div className="rounded-[11px] border p-4" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
      <div className="skeleton h-[11px] w-20 mb-3" />
      <div className="skeleton h-7 w-16 mb-2" />
      <div className="skeleton h-[10px] w-24" />
    </div>
  )
}

// One table row with N column skeletons
export function SkeletonTableRow({ cols = 4, hasAvatar = false }) {
  return (
    <tr className="border-b" style={{ borderColor: 'var(--bdr)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-2.5 py-[11px]">
          {i === 0 && hasAvatar ? (
            <div className="flex items-center gap-2">
              <div className="skeleton w-7 h-7 flex-shrink-0" style={{ borderRadius: '50%' }} />
              <div className="skeleton h-[11px] w-24" />
            </div>
          ) : (
            <div className="skeleton h-[11px]" style={{ width: i === cols - 1 ? 44 : [80, 56, 72, 44][i % 4] }} />
          )}
        </td>
      ))}
    </tr>
  )
}

// One list-item row (icon circle + two lines)
export function SkeletonListRow({ hasIcon = true }) {
  return (
    <div className="flex items-center gap-3 py-[10px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
      {hasIcon && <div className="skeleton w-7 h-7 flex-shrink-0" style={{ borderRadius: 7 }} />}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-[11px] w-32" />
        <div className="skeleton h-[9px] w-20" />
      </div>
      <div className="skeleton h-5 w-14" style={{ borderRadius: 99 }} />
    </div>
  )
}

// Staff grid card skeleton
export function SkeletonStaffCard() {
  return (
    <div className="border rounded-[10px] p-4 flex flex-col items-center text-center gap-2"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
      <div className="skeleton w-10 h-10 flex-shrink-0" style={{ borderRadius: '50%' }} />
      <div className="skeleton h-[13px] w-28" />
      <div className="skeleton h-[10px] w-20" />
      <div className="skeleton h-5 w-16" style={{ borderRadius: 99 }} />
      <div className="skeleton h-[10px] w-24" />
    </div>
  )
}

// Profile card skeleton (student dashboard header)
export function SkeletonProfile() {
  return (
    <div className="rounded-[11px] p-4 mb-4 flex flex-wrap items-center gap-4 border"
      style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
      <div className="skeleton w-10 h-10 flex-shrink-0" style={{ borderRadius: '50%' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="skeleton h-[16px] w-36" />
        <div className="skeleton h-[10px] w-52" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="skeleton h-7 w-14" />
        <div className="skeleton h-[10px] w-24" />
      </div>
    </div>
  )
}
