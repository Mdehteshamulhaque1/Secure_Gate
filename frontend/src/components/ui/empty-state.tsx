import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-white/[0.02] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-1 flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-emerald-400 shadow-card">
        {icon}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function EmptyAction({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button variant="secondary" size="sm" {...props}>{children}</Button>
}
