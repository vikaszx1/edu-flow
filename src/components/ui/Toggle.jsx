export default function Toggle({ enabled, onChange }) {
  return (
    <div
      onClick={() => onChange(!enabled)}
      className="relative w-9 h-5 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0"
      style={{ background: enabled ? 'var(--teal)' : '#d3d1c7' }}
    >
      <div
        className="absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all duration-200"
        style={{ left: enabled ? '18px' : '2px' }}
      />
    </div>
  )
}
