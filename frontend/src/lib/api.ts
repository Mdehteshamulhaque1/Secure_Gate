import type { AuthTokens } from "@/lib/types"

const ACCESS_KEY = "sg_access"
const REFRESH_KEY = "sg_refresh"

// API base URL: uses Vite proxy in dev (/api), full URL in production via VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? ""

function buildUrl(path: string): string {
  if (!API_BASE) return path // dev: use Vite proxy /api
  const base = API_BASE.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(typeof data === "string" ? data : "Request failed")
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const res = await fetch(buildUrl("/api/auth/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = (await res.json()) as AuthTokens
    localStorage.setItem(ACCESS_KEY, data.access)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let res = await fetch(buildUrl(path), { ...options, headers })

  if (res.status === 401 && retry && getRefreshToken()) {
    const ok = await refreshAccessToken()
    if (ok) return api<T>(path, options, false)
  }

  if (!res.ok) {
    let data: unknown
    try {
      data = await res.json()
    } catch {
      data = await res.text()
    }
    throw new ApiError(res.status, data)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
