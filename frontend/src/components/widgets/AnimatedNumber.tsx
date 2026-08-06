import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, duration = 700, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const from = prev.current
    const to = value
    if (from === to) return
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (p < 1) raf.current = requestAnimationFrame(step)
      else prev.current = to
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [value, duration])

  return <span className={className}>{display.toLocaleString()}</span>
}
