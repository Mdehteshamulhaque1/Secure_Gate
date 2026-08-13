import { QRCodeSVG } from "qrcode.react"
import {
  Ban,
  Building,
  Calendar,
  Car,
  Clock,
  FileText,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusChip } from "@/components/widgets/StatusChip"
import type { Visit, Visitor } from "@/lib/types"
import { formatDate, formatTime, initials } from "@/lib/utils"

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value || "—"}</div>
      </div>
    </div>
  )
}

export function VisitorDrawer({
  visitor,
  visits,
  open,
  onOpenChange,
}: {
  visitor: Visitor | null
  visits: Visit[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const myVisits = visitor ? visits.filter((v) => v.visitor?.id === visitor.id) : []
  const qrVisit = myVisits.find((v) => v.qr && v.qr.is_valid)
  const qrPayload = qrVisit ? `${qrVisit.qr!.token}|${qrVisit.qr!.signature}` : null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Visitor profile</DrawerTitle>
          <DrawerDescription>Identity, documents and visit history</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {visitor && (
            <div className="space-y-6">
              {/* Identity */}
              <div className="flex items-center gap-4">
                <Avatar name={visitor.full_name} src={visitor.photo} className="size-16 text-xl" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">{visitor.full_name}</h3>
                    {visitor.is_blacklisted && (
                      <Badge tone="danger" dot>
                        <Ban className="size-3" /> Blacklisted
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[visitor.company, visitor.designation].filter(Boolean).join(" · ") || "Independent"}
                  </p>
                </div>
              </div>

              {/* QR pass */}
              {qrPayload && qrVisit ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <ShieldCheck className="size-4" /> Active QR pass
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white p-3">
                      <QRCodeSVG value={qrPayload} size={128} />
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5" /> {formatDate(qrVisit.visit_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5" /> Expires {formatTime(qrVisit.qr!.expires_at)}
                      </div>
                      <div className="text-[11px] text-emerald-400/80">
                        Scan at security gate
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-center text-xs text-muted-foreground">
                  No active QR pass — an approved visit generates one automatically.
                </div>
              )}

              {/* Contact */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow icon={<Phone className="size-4" />} label="Phone" value={visitor.phone} />
                  <InfoRow icon={<Mail className="size-4" />} label="Email" value={visitor.email} />
                  <InfoRow icon={<IdCard className="size-4" />} label="Document" value={`${(visitor.document_type || "—").replace("_", " ")} · ${visitor.document_number || "—"}`} />
                  <InfoRow icon={<Car className="size-4" />} label="Vehicle" value={[visitor.vehicle_type, visitor.vehicle_number].filter(Boolean).join(" ") || "None"} />
                </div>
              </div>

              <Separator />

              {/* Visit history */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Visit history · {myVisits.length}
                </h4>
                {myVisits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                    No visits recorded yet.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {myVisits.map((v) => (
                      <li
                        key={v.id}
                        className="rounded-xl border border-border bg-card/50 p-3.5 transition-colors hover:border-emerald-500/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{v.purpose}</span>
                          <StatusChip status={v.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3" /> {formatDate(v.visit_date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" /> {v.expected_arrival}–{v.expected_exit}
                          </span>
                          {v.host_name && (
                            <span className="inline-flex items-center gap-1">
                              <Building className="size-3" /> Host {v.host_name}
                            </span>
                          )}
                          {v.duration_minutes > 0 && (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <Clock className="size-3" /> {v.duration_minutes}m on site
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
