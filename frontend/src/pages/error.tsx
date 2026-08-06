import { Link } from "react-router-dom"
import { Compass, Home } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div className="sg-aurora pointer-events-none absolute inset-0 -z-10" />
      <Logo className="size-12" />
      <div>
        <p className="font-display text-6xl font-black tracking-tight text-gradient">404</p>
        <h1 className="mt-2 text-lg font-semibold">This page is off the grid</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link to="/">
            <Home className="size-4" /> Back to home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <Compass className="size-4" /> Open dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
