export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Resources", href: "#resources" },
]

export const TRUST_BADGES = ["No credit card", "SOC 2 ready", "Enterprise grade"]

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2400&auto=format&fit=crop"

export const TRUST_LOGOS = [
  "Google",
  "Microsoft",
  "Amazon",
  "Infosys",
  "Accenture",
  "TCS",
  "Wipro",
  "Cognizant",
  "HCL",
] as const

export const FEATURES = [
  {
    title: "Visitor Management",
    description:
      "Pre-register visitors in seconds with rich profiles, documents, vehicles and purpose of visit — all in one place.",
    accent: "#2dd4bf",
  },
  {
    title: "QR Check-in",
    description:
      "Guests scan a cryptographically signed QR at the gate for a zero-touch check-in. No badges to print, no queues.",
    accent: "#22d3ee",
  },
  {
    title: "Approval Workflow",
    description:
      "Hosts approve or reject visit requests in one click, from any device. Slack-style decisions, instant.",
    accent: "#3b82f6",
  },
  {
    title: "Access Control",
    description:
      "Gate buildings and floors by role, time window and visitor profile. Automatic expiry keeps access tight.",
    accent: "#8b5cf6",
  },
  {
    title: "Visitor Analytics",
    description:
      "Live dashboards show who is on site, peak arrival hours and repeat-visitor patterns in real time.",
    accent: "#22c55e",
  },
  {
    title: "Employee Management",
    description:
      "Hosts, departments and buildings organized the way your org already works. Invite employees in minutes.",
    accent: "#f59e0b",
  },
  {
    title: "Reports",
    description:
      "One-click CSV and executive summaries of visit volume, duration and compliance — exported to your BI tools.",
    accent: "#f472b6",
  },
  {
    title: "Notifications",
    description:
      "Email and in-app alerts the moment a visitor arrives, is approved or requires attention. Never miss a guest.",
    accent: "#38bdf8",
  },
  {
    title: "Audit Logs",
    description:
      "Immutable, timestamped history of every action. Built for SOC 2, ISO 27001 and internal security reviews.",
    accent: "#a3e635",
  },
] as const

export const BENEFITS = [
  {
    stat: "92%",
    label: "less manual gate work",
    description: "Reception teams stop logging visitors by hand. Self-service QR check-ins handle the queue.",
  },
  {
    stat: "4×",
    label: "faster visitor approval",
    description: "Hosts approve in one tap from any device, so guests never wait in the lobby.",
  },
  {
    stat: "100%",
    label: "visitor traceability",
    description: "Every person who enters is logged — who, when, where and with whom they met.",
  },
  {
    stat: "0",
    label: "lost audit trails",
    description: "Immutable logs satisfy security reviews and compliance audits out of the box.",
  },
] as const

export const WORKFLOW = [
  { title: "Visitor", description: "Guest pre-registers with contact, ID and purpose.", icon: "user" },
  { title: "Approval", description: "Host approves the request instantly from anywhere.", icon: "check" },
  { title: "QR Generated", description: "A signed, expiring QR pass is issued to the visitor.", icon: "qr" },
  { title: "Check In", description: "Scan at the gate for a zero-touch, verified entry.", icon: "login" },
  { title: "Meeting", description: "Visitor connects with the host at the right desk.", icon: "meeting" },
  { title: "Check Out", description: "Guests scan out — status clears automatically.", icon: "logout" },
  { title: "Audit Log", description: "Every step lands in an immutable audit trail.", icon: "audit" },
] as const

export const FAQS = [
  {
    question: "How does the QR check-in work?",
    answer:
      "When a host approves a visit, SecureGate issues a cryptographically signed QR pass that expires automatically. The visitor shows it at the gate and security scans it — the entry is verified, timestamped and logged in milliseconds. No printing, no manual entry.",
  },
  {
    question: "Is my visitor data secure?",
    answer:
      "Yes. Data is encrypted in transit (TLS 1.3) and at rest (AES-256). We support SSO/SAML, SCIM provisioning, role-based access control, and immutable audit logs so you can demonstrate compliance to SOC 2, ISO 27001 and internal reviewers.",
  },
  {
    question: "How long does deployment take?",
    answer:
      "Most teams are live in under an hour. There's nothing to install — you create a workspace, invite employees, add buildings and print a QR code for each gate. Guided onboarding is included on every plan.",
  },
  {
    question: "Can visitors self-register?",
    answer:
      "Absolutely. You can enable a branded registration link or kiosk mode at reception. Guests submit their details, a host approves, and a QR pass lands in their inbox — all without touching your front desk.",
  },
  {
    question: "Do you integrate with my existing tools?",
    answer:
      "SecureGate ships with a REST API, webhooks, and CSV exports. We integrate with Slack, Microsoft Teams, Google Workspace and major access-control hardware. Custom integrations can be added on request.",
  },
] as const
