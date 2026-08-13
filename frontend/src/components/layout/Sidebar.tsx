import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import {
  BarChart3,
  Building2,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth"
import { usePendingCount } from "@/hooks/use-pending-count"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  gate: (role: Role) => boolean
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        gate: () => true,
      },
    ],
  },
  {
    label: "Visitors",
    items: [
      {
        label: "Visitors",
        href: "/dashboard/visitors",
        icon: Users,
        gate: () => true,
      },
      {
        label: "Register",
        href: "/dashboard/register-visit",
        icon: UserPlus,
        gate: (r) => ["EMPLOYEE", "ORG_ADMIN", "RECEPTIONIST", "SUPER_ADMIN"].includes(r),
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Approvals",
        href: "/dashboard/approvals",
        icon: CheckCheck,
        gate: (r) => ["EMPLOYEE", "ORG_ADMIN", "SUPER_ADMIN"].includes(r),
      },
      {
        label: "Security",
        href: "/dashboard/security",
        icon: ShieldCheck,
        gate: (r) => ["SECURITY", "ORG_ADMIN", "SUPER_ADMIN"].includes(r),
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        gate: (r) => ["ORG_ADMIN", "AUDITOR", "SECURITY", "RECEPTIONIST", "SUPER_ADMIN"].includes(r),
      },
    ],
  },
]

function Item({
  item,
  collapsed,
  badge,
}: {
  item: NavItem
  collapsed: boolean
  badge?: number
}) {
  const Icon = item.icon
  const content = (
    <NavLink
      to={item.href}
      end={item.href === "/dashboard"}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-emerald-500/10 text-emerald-300"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-0 rounded-lg border border-emerald-500/25 bg-emerald-500/10"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-3">
            <Icon className={cn("size-[18px] shrink-0", isActive ? "text-emerald-400" : "text-muted-foreground")} />
            {!collapsed && <span className="relative z-10">{item.label}</span>}
          </span>
          {!collapsed && badge ? (
            <span className="relative z-10 ml-auto flex size-5 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-bold text-amber-400">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }
  return content
}

export function Sidebar({ collapsed, forceVisible = false }: { collapsed: boolean; forceVisible?: boolean }) {
  const { user, org, logout } = useAuth()
  const pending = usePendingCount()
  const role = user?.role ?? "EMPLOYEE"

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 flex-col border-r border-border bg-secondary/60 backdrop-blur-xl transition-all duration-300",
        forceVisible ? "flex" : "hidden lg:flex",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border", collapsed ? "justify-center px-0" : "px-5")}>
        <NavLink to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">
              Secure<span className="text-gradient">Gate</span>
            </span>
          )}
        </NavLink>
      </div>

      <nav className={cn("flex-1 space-y-6 overflow-y-auto py-4", collapsed ? "px-2.5" : "px-3")}>
        {navGroups.map((group) => {
          const items = group.items.filter((i) => i.gate(role))
          if (items.length === 0) return null
          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <Item
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    badge={item.href === "/dashboard/approvals" ? pending : undefined}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5">
            <Building2 className="size-4 shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold">{org?.name ?? "SecureGate"}</div>
              <div className="truncate text-[10px] text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  )
}
