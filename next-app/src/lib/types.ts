export interface LocationData {
  lat?: number
  lng?: number
  country: string
  state: string
  city: string
  landmark?: string
}

export interface PetEntry {
  count: number
  type: "dog" | "cat" | "other"
}

export type PetData = PetEntry[]

export interface Assessment {
  disasterType: string[]
  disasterDetails: string
  location: LocationData
  canEvacuate: boolean
  adults: number
  children: number
  medicalConditions: string[]
  medications: string
  pets: PetData
  powerStatus: "full" | "generator" | "none"
  waterStatus: "running" | "stored" | "none"
  communications: string[]
  supplies: string[]
  hoursElapsed: number
}

export interface AgentState {
  status: "waiting" | "active" | "complete" | "error"
  transcript: string
  verdict: string | null
  severity: "critical" | "elevated" | "stable" | null
}

export type AgentName = "safety" | "medical" | "comms" | "resources" | "recovery"

export interface ActionPlan {
  sessionId: string
  location: string
  disasterType: string
  groupInfo: string
  generatedAt: string
  priorityLevel: "critical" | "elevated" | "stable"
  prioritySummary: string
  immediateActions: ActionItem[]
  medicalProtocols: MedicalProtocol[]
  communicationPlan: CommunicationPlan
  resourceChecklist: ResourceChecklist
  recoveryRoadmap: RecoveryPhase[]
}

export interface ActionItem {
  stepNumber: number
  icon: string
  title: string
  description: string
  timeframe: string
  severity: "critical" | "urgent" | "important" | "advisory"
}

export interface MedicalProtocol {
  condition: string
  priorityMedications: string
  monitoring: string
  storageGuidance: string
  watchFor: string
  emergencyThresholds: string
}

export interface CommunicationPlan {
  familyContact: string
  emergencyBroadcast: string
  offlineBackup: string
}

export interface ResourceChecklist {
  critical: ChecklistItem[]
  missing: ChecklistItem[]
  have: ChecklistItem[]
}

export interface ChecklistItem {
  label: string
  checked: boolean
}

export interface RecoveryPhase {
  timeframe: string
  title: string
  actions: string[]
}

export type SeverityLevel = "critical" | "elevated" | "stable" | "advisory"

export interface SSEEvent {
  type: string
  data: Record<string, unknown>
}
