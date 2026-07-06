"use client"

import { useEffect, useRef, useCallback } from "react"
import { useEmergencyStore } from "@/lib/store"
import type { AgentName } from "@/lib/types"

export function useSSEStream(sessionId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    updateAgent,
    setActionPlan,
    setSessionStatus,
    setPriorityLevel,
    setElapsedSeconds,
  } = useEmergencyStore()

  const connect = useCallback(() => {
    if (!sessionId) return

    const es = new EventSource(`/api/response/${sessionId}/stream`)
    eventSourceRef.current = es

    es.addEventListener("session_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      setSessionStatus("active")
    })

    es.addEventListener("agent_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      updateAgent(data.agent as AgentName, { status: "active" })
    })

    es.addEventListener("transcript_chunk", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      const agent = data.agent as AgentName
      updateAgent(agent, {
        transcript: useEmergencyStore.getState().agents[agent].transcript + data.text,
      })
    })

    es.addEventListener("inline_flag", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      // Inline flags are embedded in transcript via special markers from backend
    })

    es.addEventListener("agent_complete", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      updateAgent(data.agent as AgentName, {
        status: "complete",
        verdict: data.verdict,
        severity: data.severity,
      })
    })

    es.addEventListener("priority_set", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      setPriorityLevel(data.level)
    })

    es.addEventListener("plan_ready", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      setActionPlan(data.plan)
    })

    es.addEventListener("done", () => {
      setSessionStatus("complete")
      es.close()
    })

    es.addEventListener("error", (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      if (data.agent) {
        updateAgent(data.agent as AgentName, { status: "error" })
      }
    })

    es.onerror = () => {
      es.close()
      // Attempt reconnect every 5s
      reconnectRef.current = setTimeout(() => {
        connect()
      }, 5000)
    }
  }, [sessionId, updateAgent, setActionPlan, setSessionStatus, setPriorityLevel])

  useEffect(() => {
    connect()
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
      }
    }
  }, [connect])

  // Timer for elapsed seconds
  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(() => {
      const state = useEmergencyStore.getState()
      if (state.sessionStatus === "active") {
        setElapsedSeconds(state.elapsedSeconds + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionId, setElapsedSeconds])
}
