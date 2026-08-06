import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Background } from "@/components/background"
import { LogoWordmark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { formatApiError } from "@/lib/types"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
type FormValues = z.infer<typeof schema>

const demoAccounts = [
  { email: "admin@acme.com", label: "Org Admin" },
  { email: "alice@acme.com", label: "Employee" },
  { email: "security@acme.com", label: "Security" },
  { email: "reception@acme.com", label: "Reception" },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password)
      toast.success("Welcome back")
      navigate("/dashboard", { replace: true })
    } catch (err) {
      toast.error(formatApiError(err))
    }
  }

  return (
    <div className="flex min-h-screen">
      <Background />
      <div className="flex w-full flex-col lg:flex-row">
        {/* Left: marketing panel */}
        <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
          <div className="pointer-events-none absolute -left-24 top-24 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <LogoWordmark />
          <div className="relative max-w-md space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold leading-tight tracking-tight"
            >
              Visitor management for{" "}
              <span className="text-gradient">modern workplaces.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground"
            >
              Pre-register guests, approve visits, issue signed QR passes and manage
              check-in — all in one secure command center.
            </motion.p>
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-3"
            >
              {[
                "Signed, single-use QR passes",
                "Role-based security with full audit trail",
                "Real-time dashboard and reporting",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="size-3.5" />
                  </span>
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </motion.ul>
          </div>
          <div className="relative text-xs text-muted-foreground">
            © 2026 SecureGate · Enterprise access control
          </div>
        </div>

        {/* Right: form */}
        <div className="flex w-full max-w-md flex-col justify-center px-6 py-12 sm:px-12 lg:mx-auto">
          <div className="mb-10 lg:hidden">
            <LogoWordmark />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your work email to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  autoComplete="email"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Demo accounts
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setValue("email", a.email)
                    setValue("password", "Secure@123")
                    toast.info(`Demo filled · ${a.label}`)
                  }}
                  className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left text-xs transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
                >
                  <div className="font-semibold">{a.label}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{a.email}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
