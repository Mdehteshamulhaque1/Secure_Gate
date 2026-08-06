import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Building2,
  ChevronDown,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Sun,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import { usePendingCount } from "@/hooks/use-pending-count"
import { useVisits } from "@/lib/queries"
import { StatusChip } from "@/components/widgets/StatusChip"
import { formatDate } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("sg_theme") as "dark" | "light") || "dark",
  )
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light")
    localStorage.setItem("sg_theme", theme)
  }, [theme])
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }
}

export function Topbar({
  onMenu,
  onCollapse,
  collapsed,
}: {
  onMenu: () => void
  onCollapse: () => void
  collapsed: boolean
}) {
  const { user, org, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const pending = usePendingCount()
  const { data: pendingVisits } = useVisits("PENDING")
  const [search, setSearch] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/dashboard/visitors?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
          <Menu className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onCollapse}>
          <PanelLeft className="size-5" />
        </Button>

        <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitors or phone…"
            className="h-10 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-10 text-sm placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground md:block">
            /
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="size-[18px]" />
                {pending > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                    {pending}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {pending > 0 && <span className="text-amber-400">{pending} pending</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-72 overflow-y-auto">
                {pendingVisits && pendingVisits.length > 0 ? (
                  pendingVisits.map((v) => (
                    <Link key={v.id} to={`/approvals?visit=${v.id}`} onClick={() => setShowNotifications(false)}>
                      <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-white/5">
                        <Avatar name={v.visitor.full_name} src={v.visitor.photo} className="size-8" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{v.visitor.full_name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {v.purpose} · {formatDate(v.visit_date)}
                          </div>
                        </div>
                        <StatusChip status={v.status} />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    You're all caught up.
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Org switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden gap-2 pl-2 md:flex">
                <span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500/25 to-cyan-500/25 ring-1 ring-white/15">
                  <Building2 className="size-3.5 text-emerald-300" />
                </span>
                <span className="max-w-32 truncate text-sm font-medium">
                  {org?.name ?? "SecureGate"}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500/25 to-cyan-500/25 ring-1 ring-white/15">
                    <Building2 className="size-4 text-emerald-300" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{org?.name ?? "SecureGate"}</div>
                    <div className="text-xs text-muted-foreground">Enterprise plan</div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-full p-1 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar name={user?.full_name ?? "?"} className="size-9" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">{user?.full_name}</div>
                <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <span className={cn("text-xs", "text-muted-foreground")}>
                  Role · {ROLE_LABELS[user?.role ?? "EMPLOYEE"]}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
