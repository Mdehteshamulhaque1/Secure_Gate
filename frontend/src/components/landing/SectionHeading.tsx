import { cn } from "@/lib/utils"
import { Reveal } from "@/components/landing/Reveal"

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  align?: "center" | "left"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "mb-14 max-w-3xl lg:mb-20",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300 backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-teal-400 shadow-glow" />
        {eyebrow}
      </span>
      <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
      )}
    </Reveal>
  )
}
