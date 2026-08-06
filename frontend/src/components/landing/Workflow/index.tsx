import { motion, useReducedMotion } from "framer-motion"
import {
  CheckCheck,
  Handshake,
  LogIn,
  LogOut,
  QrCode,
  ScrollText,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { Container, Section } from "@/components/landing/Section"
import { Reveal } from "@/components/landing/Reveal"
import { WORKFLOW } from "@/components/landing/lib"

const ICONS: Record<string, LucideIcon> = {
  user: UserRound,
  check: CheckCheck,
  qr: QrCode,
  login: LogIn,
  meeting: Handshake,
  logout: LogOut,
  audit: ScrollText,
}

export function Workflow() {
  const reduce = useReducedMotion()
  return (
    <Section id="workflow" className="py-24 lg:py-32">
      <Container className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-teal-400 shadow-glow" /> How it works
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              From front desk to exit — <span className="text-gradient-teal italic">automated.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              A seven-step journey that takes visitors from arrival to audit — without a single
              paper form or manual log.
            </p>
          </Reveal>
        </div>

        <ol className="relative ml-3 space-y-6 lg:ml-4">
          <motion.span
            aria-hidden="true"
            initial={reduce ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[23px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-linear-to-b from-teal-400 via-blue-500/60 to-transparent"
          />
          {WORKFLOW.map((step, i) => {
            const Icon = ICONS[step.icon]
            return (
              <motion.li
                key={step.title}
                initial={reduce ? false : { opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-start gap-5"
              >
                <span className="glass-card relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl text-teal-300">
                  <Icon className="size-5" strokeWidth={1.8} />
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#0d1624] text-[10px] font-bold text-teal-300 ring-1 ring-teal-400/40">
                    {i + 1}
                  </span>
                </span>
                <div className="glass-card flex-1 rounded-2xl p-5">
                  <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </Container>
    </Section>
  )
}
