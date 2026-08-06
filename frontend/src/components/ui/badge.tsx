import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary"
  | "cyan"

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-white/5 text-muted-foreground border-white/10",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  danger: "bg-red-500/10 text-red-400 border-red-500/25",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  primary: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
}

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-blue-400",
  primary: "bg-emerald-400",
  cyan: "bg-cyan-400",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  dot?: boolean
}

export function Badge({ className, tone = "neutral", dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotClasses[tone])} />}
      {children}
    </span>
  )
}
