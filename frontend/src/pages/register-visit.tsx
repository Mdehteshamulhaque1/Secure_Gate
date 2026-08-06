import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Building2, CalendarClock, Send, ShieldAlert, UserRoundPlus } from "lucide-react"
import { PageHeader } from "@/components/widgets/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { useBuildings, useHosts, useRegisterVisit } from "@/lib/queries"
import { DOCUMENT_TYPES, VEHICLE_TYPES } from "@/lib/types"

const visitorSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  company: z.string().min(2, "Company is required"),
  designation: z.string().optional().default(""),
  document_type: z.string().min(1, "Select a document"),
  document_number: z.string().min(3, "Document number is required"),
  vehicle_type: z.string().optional().default("none"),
  vehicle_number: z.string().optional().default(""),
})

const visitSchema = z
  .object({
    purpose: z.string().min(4, "Purpose should be at least 4 characters"),
    host_id: z.coerce.number().min(1, "Select a host"),
    building_id: z.coerce.number().min(1, "Select a building"),
    visit_date: z.string().min(1, "Pick a date"),
    expected_arrival: z.string().min(1, "Expected arrival is required"),
    expected_exit: z.string().min(1, "Expected exit is required"),
    notes: z.string().optional().default(""),
  })
  .refine(
    (d: { expected_arrival: string; expected_exit: string }) =>
      !d.expected_arrival || !d.expected_exit || d.expected_exit > d.expected_arrival,
    {
      message: "Exit time must be after arrival",
      path: ["expected_exit"],
    },
  )

const formSchema = z.object({
  visitor: visitorSchema,
  visit: visitSchema,
})

type FormValues = z.infer<typeof formSchema>

export function RegisterVisitPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const hosts = useHosts()
  const buildings = useBuildings()
  const registerVisit = useRegisterVisit()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitor: {
        full_name: "",
        phone: "",
        email: "",
        company: "",
        designation: "",
        document_type: "PASSPORT",
        document_number: "",
        vehicle_type: "none",
        vehicle_number: "",
      },
      visit: {
        purpose: "",
        host_id: user?.id ?? undefined,
        building_id: undefined,
        visit_date: new Date().toISOString().slice(0, 10),
        expected_arrival: "09:00",
        expected_exit: "17:00",
        notes: "",
      },
    },
  })

  const vehicleType = watch("visitor.vehicle_type")

  useEffect(() => {
    if (user) {
      setValue("visit.host_id", user.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await registerVisit.mutateAsync({
        visitor: {
          ...values.visitor,
          vehicle_type: values.visitor.vehicle_type === "none" ? "" : values.visitor.vehicle_type,
        },
        visit: {
          purpose: values.visit.purpose,
          host: values.visit.host_id,
          building: values.visit.building_id,
          visit_date: values.visit.visit_date,
          expected_arrival: values.visit.expected_arrival,
          expected_exit: values.visit.expected_exit,
          notes: values.visit.notes,
        },
      })
      toast.success("Visit registered", {
        description: `${result.visitor.full_name} â€” waiting for host approval.`,
      })
      reset()
      navigate(`/dashboard/visitors?q=${encodeURIComponent(result.visitor.full_name)}`)
    } catch (err) {
      toast.error("Registration failed", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register visit"
        description="Pre-register a visitor so their entry is approved before arrival"
        actions={
          <Button variant="ghost" asChild>
            <Link to="/dashboard/visitors">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Visitor details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundPlus className="size-4 text-emerald-400" /> Visitor details
            </CardTitle>
            <CardDescription>Identity information about the person visiting</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" placeholder="Rahul Sharma" {...register("visitor.full_name")} />
              {errors.visitor?.full_name && (
                <p className="text-xs text-red-400">{errors.visitor.full_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" {...register("visitor.company")} />
              {errors.visitor?.company && (
                <p className="text-xs text-red-400">{errors.visitor.company.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" {...register("visitor.phone")} />
              {errors.visitor?.phone && (
                <p className="text-xs text-red-400">{errors.visitor.phone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" placeholder="rahul@company.com" {...register("visitor.email")} />
              {errors.visitor?.email && <p className="text-xs text-red-400">{errors.visitor.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="designation">Designation (optional)</Label>
              <Input id="designation" placeholder="Senior Engineer" {...register("visitor.designation")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="document_type">ID document</Label>
              <Select
                value={watch("visitor.document_type")}
                onValueChange={(v: string) => setValue("visitor.document_type", v)}
              >
                <SelectTrigger id="document_type">
                  <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="document_number">Document number</Label>
              <Input id="document_number" placeholder="XKPSY4821Q" {...register("visitor.document_number")} />
              {errors.visitor?.document_number && (
                <p className="text-xs text-red-400">{errors.visitor.document_number.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_type">Vehicle</Label>
              <Select
                value={vehicleType}
                onValueChange={(v: string) => {
                  setValue("visitor.vehicle_type", v)
                  if (v === "none") setValue("visitor.vehicle_number", "")
                }}
              >
                <SelectTrigger id="vehicle_type">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vehicleType !== "none" && (
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_number">Vehicle number</Label>
                <Input
                  id="vehicle_number"
                  placeholder="MH-01-AB-1234"
                  {...register("visitor.vehicle_number")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-cyan-400" /> Visit details
            </CardTitle>
            <CardDescription>Host, building and schedule for this visit</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="purpose">Purpose of visit</Label>
              <Input id="purpose" placeholder="Interview Â· Client meeting Â· Equipment delivery" {...register("visit.purpose")} />
              {errors.visit?.purpose && <p className="text-xs text-red-400">{errors.visit.purpose.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="host_id">Host</Label>
              <Select
                value={String(watch("visit.host_id") ?? "")}
                onValueChange={(v) => setValue("visit.host_id", Number(v))}
              >
                <SelectTrigger id="host_id">
                  <SelectValue placeholder="Select host" />
                </SelectTrigger>
                <SelectContent>
                  {(hosts.data ?? []).map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.visit?.host_id && <p className="text-xs text-red-400">{errors.visit.host_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="building_id">Building</Label>
              <Select
                value={String(watch("visit.building_id") ?? "")}
                onValueChange={(v) => setValue("visit.building_id", Number(v))}
              >
                <SelectTrigger id="building_id">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {(buildings.data ?? []).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.visit?.building_id && (
                <p className="text-xs text-red-400">{errors.visit.building_id.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="visit_date">Visit date</Label>
              <Input id="visit_date" type="date" {...register("visit.visit_date")} />
              {errors.visit?.visit_date && <p className="text-xs text-red-400">{errors.visit.visit_date.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expected_arrival">Arrival</Label>
                <Input id="expected_arrival" type="time" {...register("visit.expected_arrival")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expected_exit">Exit</Label>
                <Input id="expected_exit" type="time" {...register("visit.expected_exit")} />
              </div>
            </div>
            {errors.visit?.expected_exit && (
              <p className="text-xs text-red-400 sm:col-span-2">{errors.visit.expected_exit.message}</p>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={3} placeholder="Anything the security team should knowâ€¦" {...register("visit.notes")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Alert variant="warning" className="flex-1">
            <ShieldAlert className="size-4" />
            This visit starts <strong>pending host approval</strong>. The visitor gets a QR pass once approved.
          </Alert>
          <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-44">
            {isSubmitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Registeringâ€¦
              </>
            ) : (
              <>
                <Send className="size-4" /> Register visit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
