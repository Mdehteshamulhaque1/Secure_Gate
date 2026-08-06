import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, clearTokens, getAccessToken, setTokens } from "@/lib/api"
import type { AuthTokens, MeResponse, Organization, User } from "@/lib/types"

interface RegisterPayload {
  email: string
  full_name: string
  phone?: string
  password: string
}

interface AuthContextValue {
  user: User | null
  org: Organization | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await api<MeResponse>("/api/auth/me/")
      setUser(me.user)
      setOrg(me.organization)
    } catch {
      clearTokens()
      setUser(null)
      setOrg(null)
    }
  }, [])

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false)
      return
    }
    void refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await api<AuthTokens>("/api/auth/token/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      setTokens(tokens)
      await refreshUser()
    },
    [refreshUser],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = (await api<{ user: User; refresh: string; access: string }>("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      })) as unknown as AuthTokens & { user: User }
      setTokens({ access: data.access, refresh: data.refresh })
      setUser(data.user)
      setOrg(null)
    },
    [],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setOrg(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      org,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, org, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
