import { useVisits } from "@/lib/queries"

export function usePendingCount(): number {
  const { data } = useVisits("PENDING")
  return data?.length ?? 0
}
