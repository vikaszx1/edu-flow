const sizes = {
  sm: 'w-[26px] h-[26px] text-[10px]',
  md: 'w-[30px] h-[30px] text-[11px]',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export default function Avatar({ initials, colorKey, size = 'sm' }) {
  return (
    <div
      className={`${sizes[size] ?? sizes.md} av-${colorKey} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  )
}
