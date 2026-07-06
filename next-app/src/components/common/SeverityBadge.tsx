"use client"

import { ShieldAlert, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SeverityLevel } from "@/lib/types"

interface SeverityBadgeProps {
  level: SeverityLevel
  className?: string
}

const config = {
  critical: {
    bg: "bg-critical/20",
    text: "text-critical",
    border: "border-critical/30",
    icon: ShieldAlert,
    label: "CRITICAL",
  },
  elevated: {
    bg: "bg-warning/20",
    text: "text-warning",
    border: "border-warning/30",
    icon: AlertTriangle,
    label: "ELEVATED",
  },
  stable: {
    bg: "bg-stable/20",
    text: "text-stable",
    border: "border-stable/30",
    icon: CheckCircle,
    label: "STABLE",
  },
  advisory: {
    bg: "bg-info/20",
    text: "text-info",
    border: "border-info/30",
    icon: Info,
    label: "ADVISORY",
  },
}

export function SeverityBadge({ level, className }: SeverityBadgeProps) {
  const c = config[level]
  const Icon = c.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-radius-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border",
        c.bg,
        c.text,
        c.border,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </div>
  )
}
