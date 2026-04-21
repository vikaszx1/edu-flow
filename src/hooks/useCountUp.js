import { useState, useEffect } from 'react'

export default function useCountUp(target, enabled, duration = 700) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!enabled || !target) { setVal(target ?? 0); return }
    const steps = 36
    const inc   = target / steps
    let step    = 0
    const t = setInterval(() => {
      step++
      setVal(step >= steps ? target : Math.round(inc * step))
      if (step >= steps) clearInterval(t)
    }, duration / steps)
    return () => clearInterval(t)
  }, [target, enabled])
  return val
}
