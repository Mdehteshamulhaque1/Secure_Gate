import type { ReactNode } from "react"

interface ChartTooltipProps {
  active?: boolean
  payload?: { name: string; value: number | string; color?: string; dataKey?: string }[]
  label?: ReactNode
  format?: (v: number) => string
}

export function ChartTooltip({ active, payload, label, format }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3.5 py-2.5 shadow-lift backdrop-blur">
      {label !== undefined && label !== null && (
        <div className="mb-1.5 text-xs font-semibold text-foreground">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-semibold text-foreground">
              {format ? format(Number(p.value)) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
