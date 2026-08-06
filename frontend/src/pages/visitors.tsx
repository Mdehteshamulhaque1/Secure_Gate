import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Ban, Eye, Search, UserPlus, Users } from "lucide-react"
import { PageHeader } from "@/components/widgets/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { VisitorDrawer } from "@/components/visitors/VisitorDrawer"
import { useVisitors, useVisits } from "@/lib/queries"
import { formatDate } from "@/lib/utils"
import type { Visitor } from "@/lib/types"

export function VisitorsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(q)
  const [selected, setSelected] = useState<Visitor | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: visitors, isLoading } = useVisitors(q)
  const { data: allVisits } = useVisits()

  const filtered = useMemo(() => {
    if (!visitors) return []
    const term = q.trim().toLowerCase()
    if (!term) return visitors
    return visitors.filter(
      (v) =>
        v.full_name.toLowerCase().includes(term) || v.phone.includes(term) || v.company.toLowerCase().includes(term),
    )
  }, [visitors, q])

  const openVisitor = (v: Visitor) => {
    setSelected(v)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitors"
        description="Everyone who has ever entered your organization"
        actions={
          <Link to="/dashboard/register-visit">
            <Button>
              <UserPlus className="size-4" /> Register visitor
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearchParams({ q: query.trim() })
          }}
          placeholder="Search by name, phone or companyâ€¦"
          className="pl-9"
        />
      </div>

      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Users className="size-6" />}
              title="No visitors found"
              description="Try a different search, or register a new visitor to get started."
              action={
                <Link to="/dashboard/register-visit">
                  <Button size="sm">
                    <UserPlus className="size-4" /> Register visitor
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>ID document</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer" onClick={() => openVisitor(v)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={v.full_name} src={v.photo} />
                        <div>
                          <div className="font-medium">{v.full_name}</div>
                          <div className="text-xs text-muted-foreground">{v.designation}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.company || "â€”"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{v.phone}</div>
                      <div className="text-xs text-muted-foreground">{v.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.document_type ? (
                        <span className="text-xs">
                          {v.document_type.replace("_", " ")}
                          <span className="block text-muted-foreground/70">{v.document_number}</span>
                        </span>
                      ) : (
                        "â€”"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(v.created_at)}
                    </TableCell>
                    <TableCell>
                      {v.is_blacklisted ? (
                        <Badge tone="danger" dot>
                          <Ban className="size-3" /> Blacklisted
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openVisitor(v)
                        }}
                        aria-label={`View ${v.full_name}`}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <VisitorDrawer
        visitor={selected}
        visits={allVisits ?? []}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}
