import { useMemo, useState } from "react"
import { toast } from "sonner"
import { LogIn, LogOut, ShieldCheck, Users } from "lucide-react"
import { PageHeader } from "@/components/widgets/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { StatusChip } from "@/components/widgets/StatusChip"
import { useCheckIn, useCheckOut, useVisits } from "@/lib/queries"
import { formatTime } from "@/lib/utils"
import type { Visit } from "@/lib/types"

export function SecurityPage() {
  const { data: visits, isLoading } = useVisits()
  const [filter, setFilter] = useState("")
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  const inside = useMemo(
    () => (visits ?? []).filter((v) => v.status === "CHECKED_IN"),
    [visits],
  )
  const todays = useMemo(
    () => (visits ?? []).filter((v) => v.status !== "CHECKED_IN"),
    [visits],
  )

  const applyFilter = (list: Visit[]) => {
    const q = filter.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (v) =>
        v.visitor.full_name.toLowerCase().includes(q) || v.visitor.phone.includes(q) || v.purpose.toLowerCase().includes(q),
    )
  }

  const doCheckIn = async (v: Visit) => {
    try {
      await checkIn.mutateAsync(v.id)
      toast.success("Checked in", { description: `${v.visitor.full_name} is now inside the building.` })
    } catch (e) {
      toast.error("Check-in failed", { description: e instanceof Error ? e.message : "Try again." })
    }
  }

  const doCheckOut = async (v: Visit) => {
    try {
      await checkOut.mutateAsync(v.id)
      toast.success("Checked out", { description: `${v.visitor.full_name} has left the premises.` })
    } catch (e) {
      toast.error("Check-out failed", { description: e instanceof Error ? e.message : "Try again." })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security desk"
        description="Check visitors in and out at the gate"
        actions={
          <Badge tone="success" className="gap-1.5">
            <ShieldCheck className="size-3" /> {inside.length} on site
          </Badge>
        }
      />

      <div className="relative max-w-sm">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, phone or purpose…"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="inside">
          <TabsList>
            <TabsTrigger value="inside">
              Inside now <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 text-xs text-emerald-400">{inside.length}</span>
            </TabsTrigger>
            <TabsTrigger value="gate">
              At the gate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inside" className="space-y-3">
            {applyFilter(inside).length === 0 ? (
              <EmptyState
                icon={<Users className="size-6" />}
                title="Nobody on site"
                description="Visitors currently inside the building will show up here."
              />
            ) : (
              applyFilter(inside).map((v) => (
                <div key={v.id} className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Avatar name={v.visitor.full_name} src={v.visitor.photo} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{v.visitor.full_name}</span>
                      <StatusChip status={v.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {v.purpose} · Checked in {formatTime(v.checked_in_at!)} · {v.building_name ?? "Main lobby"}
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => doCheckOut(v)} disabled={checkOut.isPending}>
                    <LogOut className="size-4" /> Check out
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="gate" className="space-y-3">
            {applyFilter(todays).length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="size-6" />}
                title="Queue is clear"
                description="Approved visitors waiting to check in will appear here."
              />
            ) : (
              applyFilter(todays).map((v) => (
                <div key={v.id} className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Avatar name={v.visitor.full_name} src={v.visitor.photo} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{v.visitor.full_name}</span>
                      <StatusChip status={v.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {v.purpose} · Expected {v.expected_arrival}–{v.expected_exit} · Host {v.host_name ?? "—"}
                    </div>
                  </div>
                  <Button onClick={() => doCheckIn(v)} disabled={checkIn.isPending}>
                    <LogIn className="size-4" /> Check in
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

