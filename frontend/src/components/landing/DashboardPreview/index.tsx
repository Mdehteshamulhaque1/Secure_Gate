import { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Lock,
  QrCode,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Container, Section } from "@/components/landing/Section"
import { SectionHeading } from "@/components/landing/SectionHeading"
import { Reveal } from "@/components/landing/Reveal"
import { CountUp } from "@/components/landing/CountUp"
import { cn } from "@/lib/utils"

const CHART_DATA = [
  { day: "Aug 1", visits: 42 },
  { day: "Aug 2", visits: 38 },
  { day: "Aug 3", visits: 51 },
  { day: "Aug 4", visits: 47 },
  { day: "Aug 5", visits: 66 },
  { day: "Aug 6", visits: 58 },
  { day: "Aug 7", visits: 44 },
  { day: "Aug 8", visits: 39 },
  { day: "Aug 9", visits: 61 },
  { day: "Aug 10", visits: 73 },
  { day: "Aug 11", visits: 68 },
  { day: "Aug 12", visits: 82 },
  { day: "Aug 13", visits: 79 },
  { day: "Aug 14", visits: 91 },
]

const APPROVALS = [
  { name: "Rahul Sharma", company: "Acme Corp", time: "2 min ago", status: "Approved" },
  { name: "Meera Patel", company: "Vertex AI", time: "11 min ago", status: "Approved" },
  { name: "Jon Bell", company: "Northwind", time: "26 min ago", status: "Pending" },
  { name: "Ana Costa", company: "Lumen", time: "41 min ago", status: "Approved" },
]

const SCAN_SEEDS = [
  "Gate A · QR verified",
  "Gate B · QR verified",
  "Reception · Badge printed",
  "Gate A · QR verified",
]

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1624]/95 px-3.5 py-2.5 text-xs shadow-lift backdrop-blur-md">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
        <span className="size-1.5 rounded-full bg-teal-400" />
        {payload[0].value} visitors
      </div>
    </div>
  )
}

export function DashboardPreview() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-120px" })

  const [scanFeed, setScanFeed] = useState<{ id: number; text: string; ago: string }[]>([])
  const feedId = useRef(0)

  useEffect(() => {
    if (!inView) return
    const initial = SCAN_SEEDS.map((text) => ({
      id: feedId.current++,
      text,
      ago: `${Math.floor(Math.random() * 12) + 1} min ago`,
    }))
    setScanFeed(initial)
    const timer = setInterval(() => {
      setScanFeed((prev) => {
        const next = [
          { id: feedId.current++, text: SCAN_SEEDS[feedId.current % SCAN_SEEDS.length], ago: "just now" },
          ...prev,
        ]
        return next.slice(0, 4)
      })
    }, 4500)
    return () => clearInterval(timer)
  }, [inView])

  return (
    <Section id="dashboard-preview" className="relative py-24 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[160px]"
      />
      <Container>
        <SectionHeading
          eyebrow="Product tour"
          title="Your entire visitor journey, live."
          description="A real-time view of who's in your building, who's arriving next and every decision your team has made today."
        />

        <Reveal>
          <motion.div
            ref={ref}
            initial={reduce ? false : { opacity: 0, y: 60, rotateX: 8 }}
            animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1600 }}
            className="glass-card glow-border relative mx-auto max-w-5xl overflow-hidden rounded-2xl"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-white/[0.07] bg-[#0a1322]/90 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-1.5 text-xs text-muted-foreground">
                <Lock className="size-3 text-teal-400" /> app.securegate.io/dashboard
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-teal-400" />
                </span>
                Live
              </span>
            </div>

            {/* Glass reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.045)_48%,rgba(255,255,255,0.09)_52%,transparent_58%)]"
            />
            <div className="flex">
              {/* Mini sidebar */}
              <div className="hidden w-44 shrink-0 border-r border-white/[0.06] bg-[#0a1322]/70 p-4 md:block">
                <div className="flex items-center gap-2">
                  <Logo size={22} />
                  <span className="text-sm font-bold">
                    Secure<span className="text-gradient">Gate</span>
                  </span>
                </div>
                <div className="mt-6 space-y-1">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Users, label: "Visitors" },
                    { icon: Clock3, label: "Approvals", badge: 2 },
                    { icon: ShieldCheck, label: "Security" },
                    { icon: BarChart3, label: "Reports" },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium",
                          item.active
                            ? "bg-white/[0.07] text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3.5" /> {item.label}
                        {item.badge && (
                          <span className="ml-auto rounded-full bg-teal-500/20 px-1.5 text-[10px] font-bold text-teal-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Main panel */}
              <div className="min-w-0 flex-1 bg-[#0a1322]/40 p-5 lg:p-6">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Good morning, Alice</div>
                    <div className="text-xs text-muted-foreground">Acme Corporation · HQ Tower</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                      <Search className="size-3" /> Search visitors…
                    </div>
                    <div className="relative flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
                      <Bell className="size-3.5 text-muted-foreground" />
                      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-teal-400" />
                    </div>
                    <span className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-blue-600 text-[11px] font-bold text-white">
                      AJ
                    </span>
                  </div>
                </div>

                {/* KPI row */}
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    {
                      label: "On site now",
                      value: <CountUp to={24} className="tabular-nums" />,
                      accent: "text-teal-300",
                      chip: "Live",
                    },
                    {
                      label: "Visits today",
                      value: <CountUp to={91} className="tabular-nums" />,
                      accent: "text-blue-300",
                    },
                    {
                      label: "Pending approvals",
                      value: 2,
                      accent: "text-amber-300",
                    },
                    {
                      label: "QR scans",
                      value: <CountUp to={187} className="tabular-nums" />,
                      accent: "text-cyan-300",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        {kpi.label}
                        {kpi.chip && (
                          <span className="flex items-center gap-1 text-teal-400">
                            <span className="size-1.5 rounded-full bg-teal-400" /> {kpi.chip}
                          </span>
                        )}
                      </div>
                      <div className={cn("mt-1.5 font-serif text-3xl font-semibold", kpi.accent)}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + right rail */}
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold">Visit flow</div>
                        <div className="text-[11px] text-muted-foreground">Last 14 days</div>
                      </div>
                      <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
                        +18% vs prior
                      </span>
                    </div>
                    <div className="mt-3 h-44 lg:h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sgArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.42} />
                              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="sgLine" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#2dd4bf" />
                              <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                          />
                          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(45,212,191,0.3)" }} />
                          <Area
                            type="monotone"
                            dataKey="visits"
                            stroke="url(#sgLine)"
                            strokeWidth={2.5}
                            fill="url(#sgArea)"
                            animationDuration={1600}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Scan feed */}
                  <div className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold">Recent scans</div>
                      <QrCode className="size-3.5 text-teal-400" />
                    </div>
                    <ul className="mt-3 flex-1 space-y-2.5">
                      {scanFeed.map((scan) => (
                        <motion.li
                          key={scan.id}
                          initial={reduce ? false : { opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                        >
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-70" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-teal-400" />
                          </span>
                          <span className="flex-1 truncate text-[11px] text-foreground/85">
                            {scan.text}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{scan.ago}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Approvals */}
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">Recent approvals</div>
                    <UserPlus className="size-3.5 text-muted-foreground" />
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {APPROVALS.map((a) => (
                      <li
                        key={a.name}
                        className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-600 to-slate-700 text-[10px] font-bold text-white">
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-foreground">
                            {a.name} <span className="text-muted-foreground">· {a.company}</span>
                          </span>
                          <span className="block text-[10px] text-muted-foreground">{a.time}</span>
                        </span>
                        {a.status === "Approved" ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-teal-400" />
                        ) : (
                          <Clock3 className="size-3.5 shrink-0 text-amber-400" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </Container>
    </Section>
  )
}
