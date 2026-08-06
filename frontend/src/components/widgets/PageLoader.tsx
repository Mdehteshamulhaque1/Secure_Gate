import { Logo } from "@/components/logo"

export function PageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <div className="animate-pulse">
        <Logo className="size-10" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-blue-400" />
      </div>
    </div>
  )
}
