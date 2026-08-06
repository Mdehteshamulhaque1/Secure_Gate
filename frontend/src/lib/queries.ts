import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  Building,
  DashboardSummary,
  RegisterVisitPayload,
  RegisterVisitResponse,
  User,
  Visit,
  VisitStatus,
  Visitor,
} from "@/lib/types"

export const queryKeys = {
  summary: ["summary"] as const,
  visits: (status?: string) => ["visits", status ?? "all"] as const,
  visitors: (q?: string) => ["visitors", q ?? "all"] as const,
  hosts: ["hosts"] as const,
  buildings: ["buildings"] as const,
  me: ["me"] as const,
}

interface Paged<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function unwrap<T>(data: Paged<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results
}

export function useSummary() {
  return useQuery({
    queryKey: queryKeys.summary,
    queryFn: () => api<DashboardSummary>("/api/dashboard/summary/"),
  })
}

export function useVisits(status?: VisitStatus) {
  return useQuery({
    queryKey: queryKeys.visits(status),
    queryFn: async () =>
      unwrap<Visit>(
        await api<Paged<Visit>>(
          `/api/visits/${status ? `?status=${status}&page_size=1000` : "?page_size=1000"}`,
        ),
      ),
  })
}

export function useVisitors(search = "") {
  return useQuery({
    queryKey: queryKeys.visitors(search),
    queryFn: async () => {
      const data = await api<Paged<Visitor> | Visitor[]>(
        search
          ? `/api/visitors/search/?q=${encodeURIComponent(search)}`
          : "/api/visitors/?page_size=1000",
      )
      return unwrap<Visitor>(data)
    },
  })
}

export function useHosts() {
  return useQuery({
    queryKey: queryKeys.hosts,
    queryFn: () => api<User[]>("/api/hosts/"),
  })
}

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings,
    queryFn: () => api<Building[]>("/api/buildings/"),
  })
}

/* ---------------- Mutations ---------------- */

function useVisitAction(endpoint: "approve" | "reject" | "checkin" | "checkout") {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ detail: string; visit: Visit }>(`/api/visits/${id}/${endpoint}/`, {
        method: "POST",
        body: "{}",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}

export function useApproveVisit() {
  return useVisitAction("approve")
}
export function useRejectVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api<{ detail: string; visit: Visit }>(`/api/visits/${id}/reject/`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Declined" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}
export function useCheckIn() {
  return useVisitAction("checkin")
}
export function useCheckOut() {
  return useVisitAction("checkout")
}

export function useRegisterVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegisterVisitPayload) =>
      api<RegisterVisitResponse>("/api/visits/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] })
      queryClient.invalidateQueries({ queryKey: ["visitors"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}
