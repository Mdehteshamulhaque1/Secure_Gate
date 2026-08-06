import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-[#07111f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-[#07111f] to-transparent" />
      <div className="flex w-max animate-marquee gap-14 group-hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center gap-14">{children}</div>
        <div className="flex shrink-0 items-center gap-14" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
