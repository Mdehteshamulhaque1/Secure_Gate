import { lazy, Suspense, type ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { PageLoader } from "@/components/widgets/PageLoader"
import { useAuth } from "@/lib/auth"
import { hasRole } from "@/lib/types"
import { ApprovalsPage } from "@/pages/approvals"
import { LoginPage } from "@/pages/auth/login"
import { RegisterPage } from "@/pages/auth/register"
import { DashboardPage } from "@/pages/dashboard"
import { NotFoundPage } from "@/pages/error"
import { OnboardingPage } from "@/pages/onboarding"
import { RegisterVisitPage } from "@/pages/register-visit"
import { ReportsPage } from "@/pages/reports"
import { SecurityPage } from "@/pages/security"
import { VisitorsPage } from "@/pages/visitors"

const LandingPage = lazy(() => import("@/pages/landing"))

function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { isAuthenticated, loading, user, org } = useAuth()

  if (loading) return <PageLoader />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (org === null) return <Navigate to="/onboarding" replace />

  if (roles && user && !hasRole(user.role, roles)) return <Navigate to="/dashboard" replace />

  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route
        path="/dashboard"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="register-visit" element={<RegisterVisitPage />} />
        <Route
          path="approvals"
          element={
            <Protected roles={["ORG_ADMIN", "EMPLOYEE"]}>
              <ApprovalsPage />
            </Protected>
          }
        />
        <Route
          path="security"
          element={
            <Protected roles={["SECURITY", "ORG_ADMIN"]}>
              <SecurityPage />
            </Protected>
          }
        />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
