import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  r: number
  vy: number
  vx: number
  a: number
  tw: number
  hue: number
}

/**
 * Subtle drifting particles for the hero background.
 * Lightweight canvas implementation — respects reduced motion, pauses when
 * off-screen or when the tab is hidden, and caps device pixel ratio.
 */
export function Particles({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const COUNT = reduce ? 0 : 44
    let w = 0
    let h = 0
    let raf = 0
    let running = true
    let parts: Particle[] = []

    const spawn = (anywhere = false): Particle => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 12,
      r: Math.random() * 1.7 + 0.6,
      vy: Math.random() * 0.22 + 0.08,
      vx: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.45 + 0.14,
      tw: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.5 ? 167 : 217,
    })

    const resize = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (parts.length === 0 && COUNT > 0) {
        parts = Array.from({ length: COUNT }, () => spawn(true))
      }
    }

    const tick = (t: number) => {
      if (!running) return
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        p.y -= p.vy
        p.x += p.vx + Math.sin(t / 4000 + i * 1.3) * 0.045
        p.tw += 0.02
        if (p.y < -14) parts[i] = spawn()
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 72%, ${alpha.toFixed(3)})`
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    if (COUNT > 0) raf = requestAnimationFrame(tick)

    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting
      if (running && COUNT > 0) raf = requestAnimationFrame(tick)
    })
    observer.observe(canvas)

    const onVisibility = () => {
      running = !document.hidden
      if (running && COUNT > 0) raf = requestAnimationFrame(tick)
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
