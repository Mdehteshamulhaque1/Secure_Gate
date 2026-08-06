import { useId } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 34, className }: LogoProps) {
  const gid = useId().replace(/[:]/g, "")
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`lg-${gid}`} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="0.55" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id={`bg-${gid}`} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#06b6d4" stopOpacity="0.18" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#bg-${gid})`} />
      <rect
        width="38.5"
        height="38.5"
        x="0.75"
        y="0.75"
        rx="10.25"
        stroke={`url(#lg-${gid})`}
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="M20 7.5 L30 11 V18.5 C30 26 25.9 30.4 20 32 C14.1 30.4 10 26 10 18.5 V11 Z"
        fill="rgba(255,255,255,0.05)"
        stroke={`url(#lg-${gid})`}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.6 19 L18.8 22.2 L24.4 15.8"
        stroke="#2dd4bf"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={30} />
      <span className="text-lg font-bold tracking-tight">
        Secure<span className="text-gradient">Gate</span>
      </span>
    </span>
  )
}
