import { useMemo } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Download, FileBarChart2 } from "lucide-react"
import { PageHeader } from "@/components/widgets/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusChip } from "@/components/widgets/StatusChip"
import { useSummary, useVisits } from "@/lib/queries"
import { VISIT_STATUS_LABELS } from "@/lib/types"
import { formatDate } from "@/lib/utils"

export function ReportsPage() {
  const { data: summary, isLoading: loadingSummary } = useSummary()
  const { data: visits, isLoading: loadingVisits } = useVisits()

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of visits ?? []) counts[v.status] = (counts[v.status] ?? 0) + 1
    return counts
  }, [visits])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Visit analytics and raw data for your organization"
        actions={
          <Button variant="outline" asChild>
            <a href="/reports/reports/?export=csv" target="_blank" rel="noreferrer">
              <Download className="size-4" /> Export CSV
            </a>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Volume</CardTitle>
            <CardDescription>Total registered visits</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <span className="text-3xl font-bold tracking-tight">
                {summary?.month ?? 0}
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">This week</CardTitle>
            <CardDescription>Registrations in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <span className="text-3xl font-bold tracking-tight">{summary?.week ?? 0}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average visit</CardTitle>
            <CardDescription>Time spent on premises</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <span className="text-3xl font-bold tracking-tight">
                {summary?.avg_duration_minutes ?? 0}
                <span className="ml-1 text-sm font-medium text-muted-foreground">min</span>
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">By status</CardTitle>
            <CardDescription>All-time visit statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(statusBreakdown).map(([status, count]) => {
                  const total = visits?.length ?? 0
                  const pct = total ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <StatusChip status={status as keyof typeof VISIT_STATUS_LABELS} />
                        <span className="text-muted-foreground">
                          {count} <span className="text-xs">· {pct}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Visit log</CardTitle>
            <CardDescription>Most recent visits across all time</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-auto">
            {loadingVisits ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3">Visitor</th>
                    <th className="py-2 pr-3">Purpose</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(visits ?? []).map((v) => (
                    <tr key={v.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{v.visitor.full_name}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{v.purpose}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(v.visit_date)}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {v.duration_minutes > 0 ? `${v.duration_minutes} min` : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusChip status={v.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="card-surface flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <FileBarChart2 className="size-5" />
          </span>
          <div>
            <div className="font-semibold">Raw export</div>
            <div className="text-sm text-muted-foreground">
              Download the full visit log as a spreadsheet for your BI tools.
            </div>
          </div>
        </div>
        <a href="/reports/reports/?export=csv" target="_blank" rel="noreferrer">
          <Button>
            <Download className="size-4" /> Download CSV
          </Button>
        </a>
      </div>
    </div>
  )
}

