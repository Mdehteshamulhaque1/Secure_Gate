import * as React from "react"
import { cn } from "@/lib/utils"

const tones = {
  default: "border-border/60 bg-white/[0.03] text-foreground",
  info: "border-sky-500/25 bg-sky-500/[0.07] text-sky-200",
  warning: "border-amber-500/25 bg-amber-500/[0.07] text-amber-200",
  danger: "border-red-500/25 bg-red-500/[0.07] text-red-200",
  success: "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200",
} as const

export function Alert({
  className,
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof tones }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        tones[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
