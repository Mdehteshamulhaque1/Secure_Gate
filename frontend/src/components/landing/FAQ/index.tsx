import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"
import { Container, Section } from "@/components/landing/Section"
import { SectionHeading } from "@/components/landing/SectionHeading"
import { Reveal } from "@/components/landing/Reveal"
import { FAQS } from "@/components/landing/lib"
import { cn } from "@/lib/utils"

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const reduce = useReducedMotion()

  return (
    <Section id="resources" className="py-24 lg:py-32">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow="Resources"
          title="Answers, before you ask."
          description="Everything teams want to know before switching to SecureGate."
        />

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <Reveal key={faq.question} delay={i * 0.04}>
                <div
                  className={cn(
                    "glass-card overflow-hidden rounded-2xl transition-colors",
                    isOpen && "border-teal-400/30",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-[15px] font-semibold tracking-tight">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border",
                        isOpen
                          ? "border-teal-400/40 bg-teal-500/15 text-teal-300"
                          : "border-white/10 bg-white/[0.04] text-muted-foreground",
                      )}
                    >
                      <Plus className="size-3.5" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${i}`}
                        role="region"
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
