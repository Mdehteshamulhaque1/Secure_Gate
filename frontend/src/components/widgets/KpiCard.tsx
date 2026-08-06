import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { TrendingDown, TrendingUp } from "lucide-react"
import { AnimatedNumber } from "@/components/widgets/AnimatedNumber"
import { Sparkline } from "@/components/widgets/Sparkline"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: number
  suffix?: string
  icon: ReactNode
  accent?: "emerald" | "cyan" | "blue" | "amber" | "red" | "violet"
  trend?: number | null
  sparkline?: number[]
  index?: number
}

const accentMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400",
  cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-400",
  blue: "from-blue-500/20 to-blue-500/0 text-blue-400",
  amber: "from-amber-500/20 to-amber-500/0 text-amber-400",
  red: "from-red-500/20 to-red-500/0 text-red-400",
  violet: "from-violet-500/20 to-violet-500/0 text-violet-400",
}

const iconBgMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  emerald: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
  cyan: "bg-cyan-500/12 text-cyan-400 ring-cyan-500/20",
  blue: "bg-blue-500/12 text-blue-400 ring-blue-500/20",
  amber: "bg-amber-500/12 text-amber-400 ring-amber-500/20",
  red: "bg-red-500/12 text-red-400 ring-red-500/20",
  violet: "bg-violet-500/12 text-violet-400 ring-violet-500/20",
}

const sparkColorMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  emerald: "#34d399",
  cyan: "#22d3ee",
  blue: "#60a5fa",
  amber: "#fbbf24",
  red: "#f87171",
  violet: "#a78bfa",
}

export function KpiCard({
  label,
  value,
  suffix,
  icon,
  accent = "emerald",
  trend,
  sparkline,
  index = 0,
}: KpiCardProps) {
  const up = (trend ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="group card-surface card-surface-hover gradient-ring relative overflow-hidden"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          accentMap[accent],
        )}
      />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110",
              iconBgMap[accent],
            )}
          >
            {icon}
          </div>
          {trend !== undefined && trend !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                up
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400",
              )}
            >
              {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              <AnimatedNumber value={value} />
              {suffix && <span className="ml-0.5 text-lg font-semibold text-muted-foreground">{suffix}</span>}
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
          </div>
          {sparkline && (
            <Sparkline
              data={sparkline}
              color={sparkColorMap[accent]}
              height={36}
              width={88}
              className="opacity-80"
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
