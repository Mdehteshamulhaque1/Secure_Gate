import { Reveal } from "@/components/landing/Reveal"
import { Container } from "@/components/landing/Section"
import { Marquee } from "@/components/landing/Marquee"
import { TRUST_LOGOS } from "@/components/landing/lib"

const FONT_STYLES = [
  "font-sans font-bold tracking-tight",
  "font-serif font-semibold",
  "font-sans font-semibold tracking-wide",
]

export function Trust() {
  return (
    <section className="relative border-y border-white/[0.05] bg-white/[0.015] py-16 lg:py-20">
      <Container>
        <Reveal>
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Trusted by security &amp; facilities teams at
          </p>
        </Reveal>
      </Container>
      <Reveal className="px-6">
        <Marquee className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          {TRUST_LOGOS.map((name, i) => (
            <span
              key={name}
              aria-label={name}
              className={`select-none text-2xl text-slate-500 grayscale transition-all duration-300 hover:scale-105 hover:text-slate-200 hover:grayscale-0 lg:text-[1.7rem] ${FONT_STYLES[i % FONT_STYLES.length]}`}
            >
              {name}
            </span>
          ))}
        </Marquee>
      </Reveal>
    </section>
  )
}
