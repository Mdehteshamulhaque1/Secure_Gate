import { useState } from "react"
import { CheckCircle2, ClipboardCheck, Clock3, Mail, MessageSquareText, Phone, XCircle } from "lucide-react"
import { PageHeader } from "@/components/widgets/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/input"
import { StatusChip } from "@/components/widgets/StatusChip"
import { useApproveVisit, useRejectVisit, useVisits } from "@/lib/queries"
import type { Visit } from "@/lib/types"
import { formatDate, formatTime } from "@/lib/utils"
import { toast } from "sonner"

export function ApprovalsPage() {
  const { data: visits, isLoading } = useVisits()
  const pending = (visits ?? []).filter((v) => v.status === "PENDING")
  const recent = (visits ?? []).filter((v) => v.status !== "PENDING")

  const [rejecting, setRejecting] = useState<Visit | null>(null)
  const [reason, setReason] = useState("")

  const approve = useApproveVisit()
  const reject = useRejectVisit()

  const onApprove = async (v: Visit) => {
    try {
      await approve.mutateAsync(v.id)
      toast.success("Visit approved", { description: `QR pass generated for ${v.visitor.full_name}.` })
    } catch (e) {
      toast.error("Approval failed", { description: e instanceof Error ? e.message : "Try again." })
    }
  }

  const onReject = async () => {
    if (!rejecting) return
    try {
      await reject.mutateAsync({ id: rejecting.id, reason })
      toast.success("Visit rejected")
      setRejecting(null)
      setReason("")
    } catch (e) {
      toast.error("Rejection failed", { description: e instanceof Error ? e.message : "Try again." })
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals"
        description="Visits waiting for your decision"
        actions={
          <Badge tone="warning" className="gap-1.5">
            <Clock3 className="size-3" /> {pending.length} pending
          </Badge>
        }
      />

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Waiting for approval
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="card-surface p-6">
            <EmptyState
              icon={<ClipboardCheck className="size-6" />}
              title="You're all caught up"
              description="There are no visits waiting for approval right now."
            />
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((v) => (
              <li key={v.id} className="card-surface overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <Avatar name={v.visitor.full_name} src={v.visitor.photo} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{v.visitor.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.visitor.company || "Independent"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{v.purpose}</span>
                      <span>{formatDate(v.visit_date)} · {v.expected_arrival}–{v.expected_exit}</span>
                      {v.host_name && <span>→ Host {v.host_name}</span>}
                      {v.building_name && <span>· {v.building_name}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" /> {v.visitor.phone}
                      </span>
                      {v.visitor.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" /> {v.visitor.email}
                        </span>
                      )}
                      {v.notes && (
                        <span className="inline-flex items-center gap-1 italic">
                          <MessageSquareText className="size-3" /> {v.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      onClick={() => setRejecting(v)}
                      disabled={reject.isPending}
                    >
                      <XCircle className="size-4" /> Reject
                    </Button>
                    <Button
                      className="min-w-28"
                      onClick={() => onApprove(v)}
                      disabled={approve.isPending}
                    >
                      <CheckCircle2 className="size-4" /> Approve
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent decisions
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past decisions yet.</p>
        ) : (
          <div className="card-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 8).map((v) => (
                  <tr key={v.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{v.visitor.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.purpose}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(v.visit_date)}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={v.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this visit?</DialogTitle>
            <DialogDescription>
              {rejecting && `${rejecting.visitor.full_name}'s visit on ${formatTime(rejecting.expected_arrival)}, ${formatDate(rejecting.visit_date)}`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection (optional)"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onReject}
              disabled={reject.isPending}
            >
              {reject.isPending ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
