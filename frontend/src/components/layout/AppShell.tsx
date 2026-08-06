import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Background } from "@/components/background"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"

export function AppShell() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sg_sidebar_collapsed") === "1",
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem("sg_sidebar_collapsed", c ? "0" : "1")
      return !c
    })
  }

  return (
    <div className="min-h-screen">
      <Background />
      <div className="flex">
        <Sidebar collapsed={collapsed} />

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
              >
                <Sidebar collapsed={false} forceVisible />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <Topbar onMenu={() => setMobileOpen(true)} onCollapse={toggleCollapse} collapsed={collapsed} />
          <main className="px-4 py-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
