import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, LogIn, Rocket, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Background } from "@/components/background"
import { LogoWordmark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoader } from "@/components/widgets/PageLoader"
import { useAuth } from "@/lib/auth"
import { useCreateOrganization, useJoinOrganization } from "@/lib/queries"
import { formatApiError } from "@/lib/types"

const createSchema = z.object({
  name: z.string().min(2, "Workspace name is required"),
  tagline: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  building_name: z.string().optional().default("Head Office"),
})
type CreateValues = z.infer<typeof createSchema>

const joinSchema = z.object({
  slug: z.string().min(1, "Workspace slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
})
type JoinValues = z.infer<typeof joinSchema>

export function OnboardingPage() {
  const { isAuthenticated, loading, org, refreshUser } = useAuth()
  const navigate = useNavigate()
  const createOrg = useCreateOrganization()
  const joinOrg = useJoinOrganization()

  const [tab, setTab] = useState("create")

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", tagline: "", city: "", country: "", building_name: "Head Office" },
  })
  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { slug: "" },
  })

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (org) return <Navigate to="/dashboard" replace />

  const onCreate = async (values: CreateValues) => {
    try {
      await createOrg.mutateAsync({
        ...values,
        tagline: values.tagline || undefined,
        city: values.city || undefined,
        country: values.country || undefined,
        building_name: values.building_name || undefined,
      })
      await refreshUser()
      toast.success("Workspace created", {
        description: `Welcome to ${values.name}. Start by registering a visitor.`,
      })
      navigate("/dashboard", { replace: true })
    } catch (err) {
      toast.error(formatApiError(err))
    }
  }

  const onJoin = async (values: JoinValues) => {
    try {
      await joinOrg.mutateAsync(values)
      await refreshUser()
      toast.success("Joined workspace")
      navigate("/dashboard", { replace: true })
    } catch (err) {
      toast.error(formatApiError(err))
    }
  }

  return (
    <div className="flex min-h-screen">
      <Background />
      <div className="mx-auto flex w-full max-w-xl flex-col justify-center px-6 py-12 sm:px-0">
        <div className="mb-10 flex items-center justify-between">
          <LogoWordmark />
          <Button variant="ghost" asChild className="text-sm text-muted-foreground">
            <a href="/login">Sign out</a>
          </Button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Set up your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            SecureGate needs a workspace to scope visitors, buildings and approvals.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="create" className="flex-1 gap-2">
              <Sparkles className="size-4" /> Create a workspace
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1 gap-2">
              <LogIn className="size-4" /> Join a workspace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="size-4 text-emerald-400" /> Start fresh
                </CardTitle>
                <CardDescription>
                  You'll become the admin. A default building is created so you can register
                  visitors right away.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="org_name">Workspace name</Label>
                    <Input id="org_name" placeholder="Acme Corporation" {...createForm.register("name")} />
                    {createForm.formState.errors.name && (
                      <p className="text-xs text-red-400">{createForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="building_name">Default building</Label>
                      <Input id="building_name" placeholder="Head Office" {...createForm.register("building_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tagline">Tagline (optional)</Label>
                      <Input id="tagline" placeholder="Visit securely, every time" {...createForm.register("tagline")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City (optional)</Label>
                      <Input id="city" placeholder="Mumbai" {...createForm.register("city")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country (optional)</Label>
                      <Input id="country" placeholder="India" {...createForm.register("country")} />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={createForm.formState.isSubmitting || createOrg.isPending}
                  >
                    {createOrg.isPending ? "Creating workspace…" : "Create workspace"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-cyan-400" /> Join an existing workspace
                </CardTitle>
                <CardDescription>
                  Ask the workspace admin for its slug, e.g. <code className="text-muted-foreground">acme-corp</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={joinForm.handleSubmit(onJoin)} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="org_slug">Workspace slug</Label>
                    <Input id="org_slug" placeholder="acme-corp" {...joinForm.register("slug")} />
                    {joinForm.formState.errors.slug && (
                      <p className="text-xs text-red-400">{joinForm.formState.errors.slug.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    loading={joinForm.formState.isSubmitting || joinOrg.isPending}
                  >
                    {joinOrg.isPending ? "Joining…" : "Join workspace"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
