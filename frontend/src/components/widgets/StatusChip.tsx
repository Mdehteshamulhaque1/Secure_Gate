import { Badge, type BadgeTone } from "@/components/ui/badge"
import { VISIT_STATUS_LABELS, type VisitStatus } from "@/lib/types"

const toneByStatus: Record<VisitStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  CHECKED_IN: "success",
  CHECKED_OUT: "neutral",
  ARCHIVED: "neutral",
  EXPIRED: "cyan",
}

export function StatusChip({ status }: { status: VisitStatus }) {
  return (
    <Badge tone={toneByStatus[status]} dot>
      {VISIT_STATUS_LABELS[status]}
    </Badge>
  )
}
