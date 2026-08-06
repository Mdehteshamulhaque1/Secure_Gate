import { useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import {
  BadgeCheck,
  CalendarCheck,
  Lock,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { HERO_IMAGE, TRUST_BADGES } from "@/components/landing/lib"
import { EASE } from "@/components/landing/motion"
import { Particles } from "@/components/landing/Particles"

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [imageFailed, setImageFailed] = useState(false)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 18 })
  const sy = useSpring(my, { stiffness: 40, damping: 18 })

  const imgX = useTransform(sx, [-0.5, 0.5], [12, -12])
  const imgY = useTransform(sy, [-0.5, 0.5], [12, -12])
  const glowX = useTransform(sx, [-0.5, 0.5], [-30, 30])
  const glowY = useTransform(sy, [-0.5, 0.5], [-30, 30])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const scrollImageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"])
  const scrollContentY = useTransform(scrollYProgress, [0, 1], ["0%", "34%"])
  const scrollFade = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  const onMouseMove = (e: React.MouseEvent) => {
    if (reduce) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <div
      id="top"
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden pt-24 lg:pt-28"
    >
      {/* Ambient gradient base */}
      <div className="sg-landing-hero" aria-hidden="true" />
      <div className="sg-landing-grid" aria-hidden="true" />

      {/* Background image — muted, blurred, parallax */}
      <motion.div
        aria-hidden="true"
        style={reduce ? undefined : { y: scrollImageY, x: imgX, scale: 1.08 }}
        className="absolute inset-0"
      >
        {!imageFailed && (
          <img
            src={HERO_IMAGE}
            alt=""
            loading="eager"
            fetchPriority="high"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover opacity-40 blur-[2px]"
            sizes="100vw"
          />
        )}
      </motion.div>

      {/* Readability overlays */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-[#07111f]/85 via-[#07111f]/72 to-[#07111f]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-[#07111f]/80 via-transparent to-[#07111f]/60" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(7,17,31,0.6)_100%)]" />

      {/* Floating blurred blobs */}
      <motion.div
        aria-hidden="true"
        style={reduce ? undefined : { x: glowX, y: glowY }}
        className="pointer-events-none absolute left-[8%] top-[24%] size-[26rem] animate-blob rounded-full bg-teal-500/12 blur-[110px]"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[6%] top-[16%] size-[22rem] animate-blob rounded-full bg-blue-600/12 blur-[100px] [animation-delay:-6s]"
      />
      <div aria-hidden="true" className="sg-noise" />

      {/* Light rays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-30%] h-[120%] w-[70%] -translate-x-1/2 opacity-[0.14]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, transparent 62%, rgba(45,212,191,0.5) 70%, transparent 78%, rgba(96,165,250,0.4) 84%, transparent 92%)",
          animation: reduce ? undefined : "ray 32s linear infinite",
        }}
      />

      {/* Animated particles */}
      <Particles className="pointer-events-none absolute inset-0 z-[1]" />

      {/* Copy */}
      <motion.div
        style={reduce ? undefined : { y: scrollContentY, opacity: scrollFade }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-4 text-xs font-medium text-muted-foreground backdrop-blur-md"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-teal-500/20 to-blue-500/20 px-2.5 py-0.5 font-semibold text-teal-300">
            <Sparkles className="size-3.5" /> New
          </span>
          AI-assisted visitor screening is here
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.28, ease: EASE }}
          className="mt-8 font-serif text-5xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          Secure every visitor.
          <br />
          <span className="text-gradient-teal italic">Protect every workplace.</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.42, ease: EASE }}
          className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          Modern visitor management for enterprise organizations. Pre-register guests, approve in one tap,
          and check them in with a signed QR pass — all in an immutable audit trail.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.56, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button
            variant="glass"
            size="lg"
            className="w-full gap-2 rounded-xl px-7 text-foreground sm:w-auto"
            asChild
          >
            <a href="#dashboard-preview">
              <PlayCircle className="size-5 text-teal-400" /> Watch product tour
            </a>
          </Button>
        </motion.div>

        <motion.ul
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.72, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-sm text-muted-foreground"
        >
          {TRUST_BADGES.map((badge) => (
            <li key={badge} className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-teal-400" /> {badge}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Floating glass cards */}
      <motion.div
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 1, delay: 0.9, ease: EASE }}
        className="glass-card absolute left-[4%] top-[30%] z-10 hidden w-64 animate-float-slow rounded-2xl p-4 xl:block"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex size-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
            <ShieldCheck className="size-5" />
            <span className="absolute inset-0 animate-pulse-ring rounded-xl border border-teal-400/60" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">QR verified</div>
            <div className="text-sm font-semibold">Entry granted · 0.4s</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, y: 30, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 2 }}
        transition={{ duration: 1, delay: 1.05, ease: EASE }}
        className="glass-card absolute bottom-[26%] right-[4%] z-10 hidden w-56 animate-float rounded-2xl p-4 [animation-delay:-3s] xl:block"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
            <CalendarCheck className="size-5" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">Host approved</div>
            <div className="text-sm font-semibold">Just now</div>
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-7 z-10 flex flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="text-[11px] uppercase tracking-[0.22em]">Scroll</span>
        <span className="block h-8 w-px overflow-hidden bg-white/15">
          <motion.span
            className="block h-3 w-full bg-linear-to-b from-teal-400 to-transparent"
            animate={reduce ? undefined : { y: [-12, 32] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </div>
  )
}
