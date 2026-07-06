// SSE connection handler for the emergency response stream
// Used in conjunction with useSSEStream hook

export interface SSECallbacks {
  onSessionStart?: (data: { sessionId: string }) => void
  onAgentStart?: (data: { agent: string }) => void
  onTranscriptChunk?: (data: { agent: string; text: string }) => void
  onInlineFlag?: (data: { agent: string; severity: string; message: string; corrective_action?: string }) => void
  onAgentComplete?: (data: { agent: string; verdict: string; severity: string }) => void
  onPrioritySet?: (data: { level: string }) => void
  onPlanReady?: (data: { plan: unknown }) => void
  onDone?: (data: { sessionId: string }) => void
  onError?: (data: { agent?: string; message: string }) => void
}

function parseEvent<T>(json: string): T {
  return JSON.parse(json) as T
}

export function createSSEConnection(
  sessionId: string,
  callbacks: SSECallbacks
): EventSource {
  const es = new EventSource(`/api/response/${sessionId}/stream`)

  if (callbacks.onSessionStart) {
    es.addEventListener("session_start", (e: MessageEvent) => {
      callbacks.onSessionStart!(parseEvent(e.data))
    })
  }
  if (callbacks.onAgentStart) {
    es.addEventListener("agent_start", (e: MessageEvent) => {
      callbacks.onAgentStart!(parseEvent(e.data))
    })
  }
  if (callbacks.onTranscriptChunk) {
    es.addEventListener("transcript_chunk", (e: MessageEvent) => {
      callbacks.onTranscriptChunk!(parseEvent(e.data))
    })
  }
  if (callbacks.onInlineFlag) {
    es.addEventListener("inline_flag", (e: MessageEvent) => {
      callbacks.onInlineFlag!(parseEvent(e.data))
    })
  }
  if (callbacks.onAgentComplete) {
    es.addEventListener("agent_complete", (e: MessageEvent) => {
      callbacks.onAgentComplete!(parseEvent(e.data))
    })
  }
  if (callbacks.onPrioritySet) {
    es.addEventListener("priority_set", (e: MessageEvent) => {
      callbacks.onPrioritySet!(parseEvent(e.data))
    })
  }
  if (callbacks.onPlanReady) {
    es.addEventListener("plan_ready", (e: MessageEvent) => {
      callbacks.onPlanReady!(parseEvent(e.data))
    })
  }
  if (callbacks.onDone) {
    es.addEventListener("done", (e: MessageEvent) => {
      callbacks.onDone!(parseEvent(e.data))
    })
  }
  if (callbacks.onError) {
    es.addEventListener("error", (e: MessageEvent) => {
      callbacks.onError!(parseEvent(e.data))
    })
  }

  es.onerror = () => {
    callbacks.onError?.({ message: "Connection lost. Retrying..." })
  }

  return es
}
