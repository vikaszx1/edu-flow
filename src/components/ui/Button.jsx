export default function Button({ children, variant = 'primary', className = '', onClick, style, type = 'button', disabled = false }) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[7px] text-[12px] font-medium cursor-pointer border-none font-dmsans transition-opacity duration-100'
  const variants = {
    primary: 'text-white',
    outline: 'border border-[color:var(--bdr)] bg-white hover:bg-[color:var(--bg)]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variant === 'primary' ? { background: 'var(--pri)', opacity: disabled ? 0.6 : 1, ...style } : { opacity: disabled ? 0.6 : 1, ...style }}
      className={`${base} ${variants[variant]} ${className} ${disabled ? 'pointer-events-none' : ''}`}
    >
      {children}
    </button>
  )
}
