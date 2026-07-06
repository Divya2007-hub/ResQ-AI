"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Timer, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AgentCard } from "@/components/agents/AgentCard"
import { AgentStatusSidebar } from "@/components/agents/AgentStatusSidebar"
import { RadarPing } from "@/components/radar/RadarPing"
import { useEmergencyStore } from "@/lib/store"
import { formatTime } from "@/lib/utils"
import type { AgentName, AgentState } from "@/lib/types"
import { toast } from "sonner"

const agentNames: AgentName[] = ["safety", "medical", "comms", "resources", "recovery"]

export default function LiveResponsePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  // Select individual state slices to avoid full-store re-renders
  const agents = useEmergencyStore((s) => s.agents)
  const elapsedSeconds = useEmergencyStore((s) => s.elapsedSeconds)
  const priorityLevel = useEmergencyStore((s) => s.priorityLevel)

  const allComplete = agentNames.every((n) => agents[n].status === "complete")
  const anyActive = agentNames.some((n) => agents[n].status === "active")
  const completeCount = agentNames.filter((n) => agents[n].status === "complete").length

  // Fetch agent responses from Gemini API
  useEffect(() => {
    const s = useEmergencyStore.getState()
    s.setSessionId(sessionId)
    s.setSessionStatus("active")

    const a = s.assessment
    const locationStr = [a.location.city, a.location.state].filter(Boolean).join(", ") || "your area"
    const disaster = a.disasterType[0] || "emergency"

    // Determine priority from disaster type
    const criticalDisasters = ["earthquake", "flooding", "tornado", "tsunami", "wildfire", "hurricane", "chemical-spill"]
    const elevatedDisasters = ["power-outage", "winter-storm", "structural", "civil-unrest", "medical"]
    const computedPriority = criticalDisasters.includes(disaster) ? "critical" as const
      : elevatedDisasters.includes(disaster) ? "elevated" as const
      : "elevated" as const

    let agentIdx = 0
    let charIdx = 0
    let currentText = ""

    const fetchAgent = async (name: AgentName) => {
      try {
        const res = await fetch("/api/agent-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentName: name, assessment: a }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        return data as { text: string; verdict: string; severity: string }
      } catch {
        // Fallback if API fails
        return null
      }
    }

    const agents: { name: AgentName; response: Awaited<ReturnType<typeof fetchAgent>> }[] = []

    const startAgent = () => {
      if (agentIdx >= agentNames.length) {
        const state = useEmergencyStore.getState()
        state.setSessionStatus("complete")
        state.setPriorityLevel(computedPriority)
        state.setActionPlan({
          sessionId,
          location: locationStr,
          disasterType: a.disasterType[0] || "emergency",
          groupInfo: `${a.adults} adult${a.adults !== 1 ? "s" : ""}${a.children > 0 ? `, ${a.children} child${a.children !== 1 ? "ren" : ""}` : ""}`,
          generatedAt: new Date().toISOString(),
          priorityLevel: computedPriority,
          prioritySummary: `${a.disasterType[0] || "Emergency"} active in ${locationStr}. ${a.canEvacuate ? "Evacuation recommended." : "Shelter in place advised."}`,
          immediateActions: [],
          medicalProtocols: [],
          communicationPlan: { familyContact: "", emergencyBroadcast: "", offlineBackup: "" },
          resourceChecklist: { critical: [], missing: [], have: [] },
          recoveryRoadmap: [],
        })
        toast.success("Response team complete! View your action plan.")
        return
      }

      const name = agentNames[agentIdx]
      useEmergencyStore.getState().updateAgent(name, { status: "active", transcript: "", verdict: null, severity: null })
      currentText = ""
      charIdx = 0

      fetchAgent(name).then((response) => {
        agents[agentIdx] = { name, response }
        startTyping()
      })
    }

    const startTyping = () => {
      const entry = agents[agentIdx]
      const text = entry.response?.text || ""
      if (!text) {
        finishAgent(entry.name)
        return
      }

      const interval = setInterval(() => {
        if (charIdx < text.length) {
          const chunk = text.slice(0, charIdx + 3)
          useEmergencyStore.getState().updateAgent(entry.name, { transcript: chunk })
          charIdx += 3
        } else {
          clearInterval(interval)
          const verdict = entry.response?.verdict || ""
          const severity = (entry.response?.severity as any) || "elevated"
          useEmergencyStore.getState().updateAgent(entry.name, { transcript: text, status: "complete", verdict, severity })
          if (entry.name === "safety") {
            useEmergencyStore.getState().setPriorityLevel(computedPriority)
          }
          agentIdx++
          setTimeout(startAgent, 300)
        }
      }, 30)
    }

    const finishAgent = (name: AgentName) => {
      useEmergencyStore.getState().updateAgent(name, { status: "complete" })
      agentIdx++
      setTimeout(startAgent, 300)
    }

    startAgent()

    return () => {}
  }, [sessionId])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useEmergencyStore.getState()
      if (state.sessionStatus === "active") {
        state.setElapsedSeconds(state.elapsedSeconds + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen flex flex-col pt-14">
      {/* Top status bar */}
      <div className={`h-12 border-b border-border flex items-center px-4 md:px-6 gap-4 transition-colors duration-500 ${
        allComplete ? "bg-stable/10 border-stable/30" : "bg-bg/80"
      }`}>
        <RadarPing size={24} active={!allComplete} blips={2} className="scale-[0.3]" />
        <span className="font-mono text-xs text-brand uppercase tracking-wider">
          {allComplete ? "RESPONSE COMPLETE" : "RESPONSE ACTIVE"}
        </span>
        <span className="font-mono text-xs text-text-3">
          Session #{sessionId}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Timer className="w-3.5 h-3.5 text-text-2" />
          <span className="font-mono text-sm text-text-2">
            {formatTime(elapsedSeconds)}
          </span>
          <Badge variant={allComplete ? "stable" : "default"} className="text-[10px]">
            {allComplete ? "All agents complete" : `${completeCount}/5 agents running`}
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - desktop only */}
        <aside className="hidden lg:flex w-[240px] border-r border-border p-4 overflow-y-auto flex-col">
          <AgentStatusSidebar
            agents={agents as Record<AgentName, AgentState>}
            priorityLevel={priorityLevel}
            anyActive={anyActive}
            allComplete={allComplete}
          />
        </aside>

        {/* Center: Agent columns - desktop */}
        <div className="hidden lg:flex flex-1 gap-4 p-4 overflow-x-auto">
          {agentNames.map((name) => (
            <div key={name} className="flex-1 min-w-[200px] max-w-[280px]">
              <AgentCard
                name={name}
                status={agents[name].status}
                transcript={agents[name].transcript}
                verdict={agents[name].verdict}
                severity={agents[name].severity}
              />
            </div>
          ))}
        </div>

        {/* Mobile: Tabbed view */}
        <div className="lg:hidden flex-1 p-4 overflow-y-auto">
          <Tabs defaultValue="safety" className="w-full">
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-1 bg-transparent p-0 h-auto">
              {agentNames.map((name) => {
                const labels: Record<AgentName, string> = {
                  safety: "Safety",
                  medical: "Medical",
                  comms: "Comms",
                  resources: "Resources",
                  recovery: "Recovery",
                }
                const colors: Record<AgentName, string> = {
                  safety: "data-[state=active]:border-l-critical",
                  medical: "data-[state=active]:border-l-warning",
                  comms: "data-[state=active]:border-l-brand",
                  resources: "data-[state=active]:border-l-info",
                  recovery: "data-[state=active]:border-l-stable",
                }
                return (
                  <TabsTrigger
                    key={name}
                    value={name}
                    className={`border-l-2 border-transparent ${colors[name]} rounded-none px-3 py-2 text-xs`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      agents[name].status === "active" ? "bg-brand animate-pulse-dot" :
                      agents[name].status === "complete" ? "bg-stable" :
                      agents[name].status === "error" ? "bg-critical" : "bg-text-3"
                    }`} />
                    {labels[name]}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {agentNames.map((name) => (
              <TabsContent key={name} value={name} className="mt-3">
                <AgentCard
                  name={name}
                  status={agents[name].status}
                  transcript={agents[name].transcript}
                  verdict={agents[name].verdict}
                  severity={agents[name].severity}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="h-14 border-t border-border bg-surface flex items-center px-4 md:px-6">
        <span className="text-xs text-text-2 font-mono">
          {completeCount}/5 agents complete
        </span>
        <div className="ml-auto">
          <Button
            variant={allComplete ? "default" : "secondary"}
            size="default"
            disabled={!allComplete}
            onClick={() => router.push(`/response/${sessionId}/plan`)}
            className={`font-semibold gap-2 transition-all duration-300 ${
              allComplete ? "animate-glow-pulse" : ""
            }`}
          >
            View Full Action Plan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Celebration confetti effect when all complete */}
      <AnimatePresence>
        {allComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ["#06b6d4", "#16a34a", "#f1f5f9"][i % 3],
                  left: `${20 + Math.random() * 60}%`,
                  top: "50%",
                }}
                initial={{ y: 0, opacity: 1 }}
                animate={{
                  y: -(200 + Math.random() * 400),
                  x: (Math.random() - 0.5) * 200,
                  opacity: 0,
                }}
                transition={{
                  duration: 1 + Math.random(),
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
