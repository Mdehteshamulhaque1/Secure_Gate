import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { Trust } from "@/components/landing/Trust"
import { Features } from "@/components/landing/Features"
import { DashboardPreview } from "@/components/landing/DashboardPreview"
import { Workflow } from "@/components/landing/Workflow"
import { Benefits } from "@/components/landing/Benefits"
import { FAQ } from "@/components/landing/FAQ"
import { Footer } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <Trust />
        <Features />
        <DashboardPreview />
        <Workflow />
        <Benefits />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
