"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  ShieldAlert, HeartPulse, Radio, Package, TrendingUp,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { AgentName, SeverityLevel } from "@/lib/types"

interface AgentCardProps {
  name: AgentName
  status: "waiting" | "active" | "complete" | "error"
  transcript: string
  verdict: string | null
  severity: SeverityLevel | null
}

const agentConfig: Record<AgentName, { label: string; icon: typeof ShieldAlert; color: string; borderColor: string; bgColor: string }> = {
  safety: {
    label: "SAFETY",
    icon: ShieldAlert,
    color: "text-critical",
    borderColor: "border-l-critical",
    bgColor: "bg-critical/5",
  },
  medical: {
    label: "MEDICAL",
    icon: HeartPulse,
    color: "text-warning",
    borderColor: "border-l-warning",
    bgColor: "bg-warning/5",
  },
  comms: {
    label: "COMMS",
    icon: Radio,
    color: "text-brand",
    borderColor: "border-l-brand",
    bgColor: "bg-brand/5",
  },
  resources: {
    label: "RESOURCES",
    icon: Package,
    color: "text-info",
    borderColor: "border-l-info",
    bgColor: "bg-info/5",
  },
  recovery: {
    label: "RECOVERY",
    icon: TrendingUp,
    color: "text-stable",
    borderColor: "border-l-stable",
    bgColor: "bg-stable/5",
  },
}

export function AgentCard({ name, status, transcript, verdict, severity }: AgentCardProps) {
  const config = agentConfig[name]
  const Icon = config.icon
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col border-l-2 bg-surface rounded-radius-card border border-border overflow-hidden h-full",
        config.borderColor,
        status === "active" && "animate-glow-pulse"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-3 py-2.5 border-b border-border", config.bgColor)}>
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className={cn("font-display font-semibold text-xs tracking-wider", config.color)}>
          {config.label}
        </span>
        <div className="ml-auto">
          {status === "waiting" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">WAITING</Badge>}
          {status === "active" && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ACTIVE
            </Badge>
          )}
          {status === "complete" && (
            <Badge variant="stable" className="text-[10px] px-1.5 py-0 gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              DONE
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="critical" className="text-[10px] px-1.5 py-0 gap-1">
              <XCircle className="w-2.5 h-2.5" />
              ERROR
            </Badge>
          )}
        </div>
      </div>

      {/* Transcript area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed text-text-2"
      >
        {status === "waiting" && (
          <div className="flex items-center justify-center h-full text-xs text-text-3 italic">
            Waiting for panel to complete...
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <XCircle className="w-6 h-6 text-critical" />
            <p className="text-xs text-text-2">This agent encountered an issue.</p>
            <p className="text-[11px] text-text-3">Other agents are continuing.</p>
          </div>
        )}
        {(status === "active" || status === "complete") && (
          <>
            {transcript}
            {status === "active" && (
              <span className="inline-block w-2 h-4 bg-brand ml-0.5 animate-cursor-blink" />
            )}
          </>
        )}
      </div>

      {/* Progress bar for active */}
      {status === "active" && (
        <div className="px-3 pb-2">
          <Progress value={45} className="h-1" />
        </div>
      )}

      {/* Verdict footer */}
      {status === "complete" && verdict && severity && (
        <div className={cn("border-t border-border px-3 py-2", config.bgColor)}>
          <div className="flex items-center gap-2">
            {severity === "critical" && <Badge variant="critical">{verdict}</Badge>}
            {severity === "elevated" && <Badge variant="warning">{verdict}</Badge>}
            {severity === "stable" && <Badge variant="stable">{verdict}</Badge>}
          </div>
        </div>
      )}
    </motion.div>
  )
}
