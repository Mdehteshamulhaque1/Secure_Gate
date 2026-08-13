export type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "RECEPTIONIST" | "SECURITY" | "EMPLOYEE" | "AUDITOR"

export type VisitStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "ARCHIVED"
  | "EXPIRED"

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  ARCHIVED: "Archived",
  EXPIRED: "Expired",
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ORG_ADMIN: "Org Admin",
  RECEPTIONIST: "Receptionist",
  SECURITY: "Security Guard",
  EMPLOYEE: "Employee",
  AUDITOR: "Auditor",
}

export interface User {
  id: number
  email: string
  full_name: string
  phone: string
  role: Role
  organization: number | null
}

export interface Organization {
  id: number
  name: string
  slug: string
  tagline: string
  timezone: string
  working_hours_start: string
  working_hours_end: string
}

export interface Building {
  id: number
  name: string
  address: string
  floors: number
  entry_gates: number
  exit_gates: number
}

export interface MeResponse {
  user: User
  organization: Organization | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface Visitor {
  id: number
  full_name: string
  phone: string
  email: string
  company: string
  designation: string
  address: string
  photo: string | null
  document_type: string
  document_number: string
  vehicle_number: string
  vehicle_type: string
  emergency_contact: string
  emergency_phone: string
  special_notes: string
  is_blacklisted: boolean
  created_at: string
}

export interface QrPass {
  token: string
  signature: string
  expires_at: string
  is_used: boolean
  is_valid: boolean
}

export interface Visit {
  id: number
  visit_id: string
  visitor: Visitor
  host: number | null
  host_name: string
  building: number | null
  building_name: string
  purpose: string
  visit_date: string
  expected_arrival: string
  expected_exit: string
  status: VisitStatus
  qr: QrPass | null
  duration_minutes: number
  registered_at: string
  checked_in_at: string | null
  checked_out_at: string | null
  notes: string
}

export const DOCUMENT_TYPES = [
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PASSPORT", label: "Passport" },
  { value: "PAN", label: "PAN Card" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "COMPANY_ID", label: "Company ID" },
] as const

export const VEHICLE_TYPES = [
  { value: "none", label: "No vehicle" },
  { value: "CAR", label: "Car" },
  { value: "BIKE", label: "Bike" },
  { value: "TRUCK", label: "Truck" },
  { value: "VAN", label: "Van" },
  { value: "OTHER", label: "Other" },
] as const

export interface DashboardSummary {
  today: number
  week: number
  month: number
  inside: number
  pending: number
  approved: number
  avg_duration_minutes: number
}

export interface RegisterVisitPayload {
  visitor: {
    full_name: string
    phone: string
    email?: string
    company?: string
    designation?: string
    document_type?: string
    document_number?: string
    vehicle_number?: string
    vehicle_type?: string
  }
  visit: {
    purpose: string
    host?: number
    building?: number
    visit_date?: string
    expected_arrival?: string
    expected_exit?: string
    notes?: string
  }
}

export interface RegisterVisitResponse {
  visitor: Visitor
  visit: Visit
}

export interface ApiError {
  detail?: string | Record<string, string[]>
}

export function hasRole(role: Role | undefined, allowed: string[]): boolean {
  if (!role) return false
  if (allowed.includes("ORG_ADMIN") && role === "SUPER_ADMIN") return true
  return allowed.includes(role)
}

export function formatApiError(err: unknown): string {
  if (typeof err === "object" && err !== null && "detail" in err) {
    const detail = (err as ApiError).detail
    if (typeof detail === "string") return detail
    if (detail) {
      return Object.values(detail)
        .flat()
        .join(" ")
    }
  }
  return "Something went wrong. Please try again."
}
