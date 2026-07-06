"use client"

import {
  ShieldAlert, HeartPulse, Radio, Package, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadarPing } from "@/components/radar/RadarPing"
import type { AgentName, AgentState } from "@/lib/types"

interface AgentStatusSidebarProps {
  agents: Record<AgentName, AgentState>
  priorityLevel: "critical" | "elevated" | "stable" | null
  anyActive: boolean
  allComplete: boolean
}

const config: Record<AgentName, { label: string; icon: typeof ShieldAlert; color: string }> = {
  safety: { label: "Safety Coordinator", icon: ShieldAlert, color: "text-critical" },
  medical: { label: "Medical Advisor", icon: HeartPulse, color: "text-warning" },
  comms: { label: "Comms Lead", icon: Radio, color: "text-brand" },
  resources: { label: "Resource Coordinator", icon: Package, color: "text-info" },
  recovery: { label: "Recovery Planner", icon: TrendingUp, color: "text-stable" },
}

const priorityConfig = {
  critical: { label: "CRITICAL", color: "text-critical", bar: "bg-critical", width: "100%" },
  elevated: { label: "ELEVATED", color: "text-warning", bar: "bg-warning", width: "60%" },
  stable: { label: "STABLE", color: "text-stable", bar: "bg-stable", width: "30%" },
}

export function AgentStatusSidebar({ agents, priorityLevel, anyActive, allComplete }: AgentStatusSidebarProps) {
  const agentsList = Object.entries(config) as [AgentName, typeof config[AgentName]][]

  return (
    <div className="flex flex-col gap-4">
      {/* Agent status list */}
      <div className="space-y-2">
        {agentsList.map(([name, cfg]) => {
          const state = agents[name]
          const Icon = cfg.icon
          const isRunning = state.status === "active"
          const isDone = state.status === "complete"

          return (
            <div
              key={name}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-radius-card bg-surface border border-border transition-all",
                isRunning && "border-brand/30 animate-glow-pulse",
                isDone && "border-stable/20"
              )}
            >
              {/* Status dot */}
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0 transition-all",
                  state.status === "waiting" && "bg-text-3",
                  isRunning && "bg-brand animate-pulse-dot",
                  isDone && "bg-stable",
                  state.status === "error" && "bg-critical"
                )}
              />

              <Icon className={cn("w-4 h-4 shrink-0", cfg.color)} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-medium text-text truncate">{cfg.label}</p>
                <Progress
                  value={isDone ? 100 : isRunning ? 60 : 0}
                  className={cn(
                    "h-1 mt-1",
                    isDone && "[&>div]:bg-stable",
                    isRunning && "[&>div]:bg-brand"
                  )}
                />
              </div>

              <div className="shrink-0">
                {state.status === "waiting" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">WAITING</Badge>
                )}
                {isRunning && (
                  <Badge variant="default" className="text-[10px] px-1.5">ACTIVE</Badge>
                )}
                {isDone && (
                  <Badge variant="stable" className="text-[10px] px-1.5">DONE</Badge>
                )}
                {state.status === "error" && (
                  <Badge variant="critical" className="text-[10px] px-1.5">ERROR</Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mini radar */}
      <div className="flex justify-center py-2">
        <RadarPing size={80} active={anyActive} blips={3} />
      </div>

      {/* Priority level */}
      {priorityLevel && (
        <div className="bg-surface rounded-radius-card border border-border p-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-text-3 mb-2">PRIORITY LEVEL</p>
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-800 ease-out", priorityConfig[priorityLevel].bar)}
              style={{ width: priorityConfig[priorityLevel].width }}
            />
          </div>
          <p className={cn("text-xs font-semibold mt-1.5", priorityConfig[priorityLevel].color)}>
            {priorityConfig[priorityLevel].label}
          </p>
        </div>
      )}
    </div>
  )
}
