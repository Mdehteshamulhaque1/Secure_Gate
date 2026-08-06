import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  CheckCheck,
  Clock,
  Hourglass,
  LogOut,
  UserPlus,
  XCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/widgets/PageHeader"
import { KpiCard } from "@/components/widgets/KpiCard"
import { ChartCard } from "@/components/widgets/ChartCard"
import { ChartTooltip } from "@/components/widgets/ChartTooltip"
import { StatusChip } from "@/components/widgets/StatusChip"
import { Avatar } from "@/components/ui/avatar"
import { useSummary, useVisits } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { formatDate, formatTime } from "@/lib/utils"
import { VISIT_STATUS_LABELS, type VisitStatus } from "@/lib/types"

const STATUS_COLORS: Record<VisitStatus, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#3b82f6",
  REJECTED: "#ef4444",
  CHECKED_IN: "#10b981",
  CHECKED_OUT: "#94a3b8",
  ARCHIVED: "#64748b",
  EXPIRED: "#06b6d4",
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function weekSeries(visits: { registered_at: string }[], days: number) {
  const counts: { key: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    counts.push({ key: dayKey(d), count: 0 })
  }
  const map = new Map(counts.map((c) => [c.key, c]))
  for (const v of visits) {
    const key = dayKey(new Date(v.registered_at))
    const item = map.get(key)
    if (item) item.count += 1
  }
  return counts
}

export function DashboardPage() {
  const { user, org } = useAuth()
  const { data: summary, isLoading: loadingSummary } = useSummary()
  const { data: visits, isLoading: loadingVisits } = useVisits()

  const derived = useMemo(() => {
    const all = visits ?? []
    const byStatus = (s: VisitStatus) => all.filter((v) => v.status === s).length
    const today = dayKey(new Date())
    const yesterday = dayKey(new Date(Date.now() - 86400000))
    const todayCount = all.filter((v) => dayKey(new Date(v.registered_at)) === today).length
    const yesterdayCount = all.filter((v) => dayKey(new Date(v.registered_at)) === yesterday).length
    const trend = yesterdayCount > 0 ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : 0

    const flow14 = weekSeries(all, 14).map((c) => ({ date: c.key.slice(5), visits: c.count }))
    const spark = weekSeries(all, 7).map((c) => c.count)

    const statusData = (Object.keys(STATUS_COLORS) as VisitStatus[])
      .map((s) => ({ name: VISIT_STATUS_LABELS[s], value: byStatus(s), color: STATUS_COLORS[s] }))
      .filter((d) => d.value > 0)

    const visitorCounts = new Map<string, number>()
    for (const v of all) {
      const name = v.visitor.full_name
      visitorCounts.set(name, (visitorCounts.get(name) ?? 0) + 1)
    }
    const topVisitors = [...visitorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.split(" ")[0], visits: count }))

    const hourBuckets = new Array(24).fill(0)
    for (const v of all) {
      const [h] = (v.expected_arrival ?? "10:00").split(":").map(Number)
      if (Number.isFinite(h) && h >= 0 && h < 24) hourBuckets[h] += 1
    }
    const peakHours = hourBuckets
      .map((count, hour) => ({ hour: `${String(hour).padStart(2, "0")}:00`, arrivals: count }))
      .filter((d) => d.arrivals > 0)
      .slice(0, 12)

    const recent = all.slice(0, 6)

    return {
      byStatus,
      trend,
      flow14,
      spark,
      statusData,
      topVisitors,
      peakHours,
      recent,
      total: all.length,
    }
  }, [visits])

  const firstName = user?.full_name.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${firstName}`}
        description={`${org?.name ?? "SecureGate"} Â· Live visitor operations at a glance`}
        actions={
          <>
            <Link to="/dashboard/approvals">
              <Button variant="secondary" size="sm">
                <CheckCheck className="size-4" /> Approvals
              </Button>
            </Link>
            <Link to="/dashboard/register-visit">
              <Button size="sm">
                <UserPlus className="size-4" /> Register visitor
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          index={0}
          label="Visitors today"
          value={summary?.today ?? 0}
          icon={<CalendarCheck2 className="size-5" />}
          accent="emerald"
          trend={derived.trend}
          sparkline={derived.spark}
        />
        <KpiCard
          index={1}
          label="Pending approvals"
          value={summary?.pending ?? 0}
          icon={<Hourglass className="size-5" />}
          accent="amber"
          sparkline={[2, 3, 2, 4, 3, 5, summary?.pending ?? 0]}
        />
        <KpiCard
          index={2}
          label="Inside building"
          value={summary?.inside ?? 0}
          icon={<Building2 className="size-5" />}
          accent="cyan"
          sparkline={[1, 2, 1, 3, 2, 4, summary?.inside ?? 0]}
        />
        <KpiCard
          index={3}
          label="Checked out"
          value={derived.byStatus("CHECKED_OUT")}
          icon={<LogOut className="size-5" />}
          accent="blue"
          sparkline={[0, 1, 0, 2, 1, 2, derived.byStatus("CHECKED_OUT")]}
        />
        <KpiCard
          index={4}
          label="Rejected"
          value={derived.byStatus("REJECTED")}
          icon={<XCircle className="size-5" />}
          accent="red"
          sparkline={[0, 0, 1, 0, 1, 0, derived.byStatus("REJECTED")]}
        />
        <KpiCard
          index={5}
          label="Avg visit"
          value={summary?.avg_duration_minutes ?? 0}
          suffix="min"
          icon={<Clock className="size-5" />}
          accent="violet"
          sparkline={[20, 28, 24, 35, 30, 32, summary?.avg_duration_minutes ?? 0]}
        />
      </div>

      {/* Flow + status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Visit flow"
          description="Registrations per day Â· last 14 days"
          className="lg:col-span-2"
        >
          {loadingVisits ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={derived.flow14} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#8b98ad", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis tick={{ fill: "#8b98ad", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(148,163,184,0.25)" }} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#flowGrad)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Status breakdown" description="Current visit states">
          {loadingVisits ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="flex h-64 items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={derived.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {derived.statusData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{derived.total}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Peak hours + top visitors + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Peak arrival hours" description="By expected arrival">
          {loadingVisits ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={derived.peakHours} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#8b98ad", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#8b98ad", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                  <Bar dataKey="arrivals" radius={[6, 6, 0, 0]}>
                    {derived.peakHours.map((d) => (
                      <Cell key={d.hour} fill={d.arrivals > 0 ? "#22d3ee" : "transparent"} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top visitors" description="Most frequent guests">
          {loadingVisits ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={derived.topVisitors} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#8b98ad", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    tick={{ fill: "#8b98ad", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                  <Bar dataKey="visits" radius={[0, 6, 6, 0]} fill="#60a5fa" opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <Card className="lg:row-span-2">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent visits</h3>
              <Link to="/dashboard/visitors" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {loadingVisits ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : derived.recent.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No visits yet. Register your first visitor.
              </div>
            ) : (
              <ul className="space-y-1">
                {derived.recent.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/5"
                  >
                    <Avatar name={v.visitor.full_name} src={v.visitor.photo} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{v.visitor.full_name}</span>
                        <StatusChip status={v.status} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {v.purpose} Â· {formatDate(v.visit_date)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
