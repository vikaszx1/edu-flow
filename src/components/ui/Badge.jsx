const variants = {
  green:  'badge-green',
  amber:  'badge-amber',
  red:    'badge-red',
  blue:   'badge-blue',
  gray:   'badge-gray',
  purple: 'badge-purple',
}

export function statusVariant(status) {
  const map = {
    Active: 'green', Present: 'green', Ready: 'green',
    Warning: 'amber', Late: 'amber', 'On Leave': 'amber', 'Action Needed': 'amber',
    'At Risk': 'red', Absent: 'red',
    New: 'blue', 'In Progress': 'blue',
    Windows: 'blue',
  }
  return map[status] || 'gray'
}

export default function Badge({ children, variant = 'green' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-medium ${variants[variant] || variants.gray}`}
    >
      {children}
    </span>
  )
}
