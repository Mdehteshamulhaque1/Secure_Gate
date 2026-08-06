import * as React from "react"
import { cn, initials } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  src?: string | null
  className?: string
}

export function Avatar({ name, src, className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-emerald-500/30 to-cyan-500/30 text-sm font-semibold text-emerald-200 ring-1 ring-white/15",
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
