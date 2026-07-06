"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { SeverityLevel } from "@/lib/types"

interface PriorityBarProps {
  level: SeverityLevel
}

const config = {
  critical: { label: "CRITICAL — IMMEDIATE ACTION REQUIRED", bg: "bg-critical", text: "text-critical" },
  elevated: { label: "ELEVATED — INCREASED VIGILANCE NEEDED", bg: "bg-warning", text: "text-warning" },
  stable: { label: "STABLE — CONTINUE MONITORING", bg: "bg-stable", text: "text-stable" },
  advisory: { label: "ADVISORY — STANDARD PRECAUTIONS", bg: "bg-info", text: "text-info" },
}

export function PriorityBar({ level }: PriorityBarProps) {
  const [fillWidth, setFillWidth] = useState(0)
  const [showText, setShowText] = useState(false)
  const cfg = config[level]

  useEffect(() => {
    const timer = setTimeout(() => setFillWidth(100), 100)
    const textTimer = setTimeout(() => setShowText(true), 900)
    return () => {
      clearTimeout(timer)
      clearTimeout(textTimer)
    }
  }, [level])

  return (
    <div className="w-full bg-surface-2 rounded-full h-10 overflow-hidden relative">
      <div
        className={cn("h-full rounded-full transition-all duration-800 ease-out", cfg.bg)}
        style={{ width: `${fillWidth}%` }}
      />
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xs font-semibold tracking-wider", cfg.text, "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]")}>
            {cfg.label}
          </span>
        </div>
      )}
    </div>
  )
}
