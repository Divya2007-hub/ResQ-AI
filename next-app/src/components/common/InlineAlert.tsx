"use client"

import { motion } from "framer-motion"
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SeverityLevel } from "@/lib/types"

interface InlineAlertProps {
  severity: SeverityLevel
  message: string
  correctiveAction?: string
  className?: string
}

const config = {
  critical: { border: "border-l-critical", icon: ShieldAlert, color: "text-critical" },
  elevated: { border: "border-l-warning", icon: AlertTriangle, color: "text-warning" },
  stable: { border: "border-l-stable", icon: CheckCircle, color: "text-stable" },
  advisory: { border: "border-l-info", icon: Info, color: "text-info" },
}

export function InlineAlert({ severity, message, correctiveAction, className }: InlineAlertProps) {
  const c = config[severity]
  const Icon = c.icon

  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: -10 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "border-l-2 bg-surface-2 rounded-r-radius-card px-4 py-3 my-2",
        c.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", c.color)} />
        <div className="space-y-1">
          <p className="text-sm leading-relaxed text-text">{message}</p>
          {correctiveAction && (
            <p className="text-xs text-text-2 leading-relaxed">{correctiveAction}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
