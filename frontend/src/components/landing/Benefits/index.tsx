import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Container, Section } from "@/components/landing/Section"
import { Reveal } from "@/components/landing/Reveal"
import { CountUp } from "@/components/landing/CountUp"
import { BENEFITS } from "@/components/landing/lib"
import { fadeUp, stagger, viewport } from "@/components/landing/motion"

const CHECKS = [
  "Zero-touch QR check-in at every gate",
  "Host approvals from any device in seconds",
  "Immutable audit trail for compliance",
  "Real-time analytics on who's in your building",
]

export function Benefits() {
  return (
    <Section id="solutions" className="py-24 lg:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-teal-400 shadow-glow" /> Why SecureGate
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              A safer lobby.{" "}
              <span className="text-gradient-teal italic">A calmer team.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Every minute your front desk spends on clipboards is a minute lost. SecureGate automates
              the entire visitor journey so your people can focus on the work that matters.
            </p>
          </Reveal>

          <motion.ul
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-9 space-y-3.5"
          >
            {CHECKS.map((check) => (
              <motion.li
                key={check}
                variants={fadeUp}
                className="flex items-center gap-3 text-[15px] text-foreground/90"
              >
                <CheckCircle2 className="size-5 shrink-0 text-teal-400" /> {check}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:gap-6">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              transition={{ delay: (i % 2) * 0.1 }}
              className="glass-card rounded-2xl p-6 lg:p-7"
            >
              <div className="flex items-baseline gap-1">
                {benefit.stat.startsWith("4") ? (
                  <>
                    <CountUp to={4} className="font-serif text-5xl font-semibold text-gradient-teal" />
                    <span className="font-serif text-3xl font-semibold text-gradient-teal">×</span>
                  </>
                ) : benefit.stat.startsWith("92") ? (
                  <>
                    <CountUp to={92} className="font-serif text-5xl font-semibold text-gradient-teal" />
                    <span className="font-serif text-3xl font-semibold text-gradient-teal">%</span>
                  </>
                ) : benefit.stat.startsWith("100") ? (
                  <>
                    <CountUp to={100} className="font-serif text-5xl font-semibold text-gradient-teal" />
                    <span className="font-serif text-3xl font-semibold text-gradient-teal">%</span>
                  </>
                ) : (
                  <span className="font-serif text-5xl font-semibold text-gradient-teal">0</span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{benefit.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
