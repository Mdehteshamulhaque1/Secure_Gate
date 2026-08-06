import { Link } from "react-router-dom"
import { Github, Linkedin, Lock, Twitter } from "lucide-react"
import { Logo } from "@/components/logo"
import { Container } from "@/components/landing/Section"

const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "QR Check-in", "Approval Workflow", "Analytics"],
  },
  {
    title: "Solutions",
    links: ["Enterprise", "Multi-site", "Kiosk mode", "Event check-in", "Contractors"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API reference", "Security", "Status", "Blog"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Partners", "Legal"],
  },
] as const

const SOCIALS = [
  { icon: Github, label: "GitHub" },
  { icon: Twitter, label: "X (Twitter)" },
  { icon: Linkedin, label: "LinkedIn" },
]

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050d19]">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link to="/" aria-label="SecureGate home" className="inline-flex">
              <span className="flex items-center gap-2.5">
                <Logo size={30} />
                <span className="text-lg font-bold tracking-tight">
                  Secure<span className="text-gradient">Gate</span>
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The visitor and access management platform for modern workplaces. Secure every
              visitor. Protect every workplace.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-all hover:border-teal-400/40 hover:text-teal-300"
                  >
                    <Icon className="size-4" />
                  </a>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-7 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SecureGate, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="transition-colors hover:text-foreground">Terms</a>
            <a href="#" className="transition-colors hover:text-foreground">Security</a>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
              <Lock className="size-3.5 text-teal-400" /> SOC 2 · ISO 27001 ready
            </span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
