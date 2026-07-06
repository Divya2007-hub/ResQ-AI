import { create } from "zustand"
import type { Assessment, AgentState, AgentName, ActionPlan, LocationData, PetData, PetEntry } from "./types"

interface EmergencyStore {
  currentStep: number
  assessment: Assessment
  sessionId: string | null
  sessionStatus: "idle" | "creating" | "active" | "complete" | "error"
  agents: Record<AgentName, AgentState>
  actionPlan: ActionPlan | null
  elapsedSeconds: number
  priorityLevel: "critical" | "elevated" | "stable" | null

  setStep: (step: number) => void
  updateAssessment: (data: Partial<Assessment>) => void
  setDisasterType: (types: string[]) => void
  setDisasterDetails: (details: string) => void
  setLocation: (location: LocationData) => void
  setCanEvacuate: (canEvacuate: boolean) => void
  setPeople: (adults: number, children: number) => void
  setMedicalConditions: (conditions: string[]) => void
  setMedications: (meds: string) => void
  setPets: (pets: PetData) => void
  setPowerStatus: (status: "full" | "generator" | "none") => void
  setWaterStatus: (status: "running" | "stored" | "none") => void
  setCommunications: (comms: string[]) => void
  setSupplies: (supplies: string[]) => void
  setHoursElapsed: (hours: number) => void
  resetAssessment: () => void
  startSession: () => Promise<void>
  setSessionId: (id: string) => void
  setSessionStatus: (status: "idle" | "creating" | "active" | "complete" | "error") => void
  updateAgent: (name: AgentName, update: Partial<AgentState>) => void
  setActionPlan: (plan: ActionPlan) => void
  setElapsedSeconds: (seconds: number) => void
  setPriorityLevel: (level: "critical" | "elevated" | "stable") => void
  resetAll: () => void
}

const defaultAssessment: Assessment = {
  disasterType: [],
  disasterDetails: "",
  location: { country: "", state: "", city: "" },
  canEvacuate: true,
  adults: 0,
  children: 0,
  medicalConditions: [],
  medications: "",
  pets: [],
  powerStatus: "none",
  waterStatus: "none",
  communications: [],
  supplies: [],
  hoursElapsed: 0,
}

const defaultAgentState: AgentState = {
  status: "waiting",
  transcript: "",
  verdict: null,
  severity: null,
}

const defaultAgents: Record<AgentName, AgentState> = {
  safety: { ...defaultAgentState },
  medical: { ...defaultAgentState },
  comms: { ...defaultAgentState },
  resources: { ...defaultAgentState },
  recovery: { ...defaultAgentState },
}

export const useEmergencyStore = create<EmergencyStore>((set, get) => ({
  currentStep: 1,
  assessment: { ...defaultAssessment },
  sessionId: null,
  sessionStatus: "idle",
  agents: { ...defaultAgents },
  actionPlan: null,
  elapsedSeconds: 0,
  priorityLevel: null,

  setStep: (step) => set({ currentStep: step }),

  updateAssessment: (data) =>
    set((state) => ({ assessment: { ...state.assessment, ...data } })),

  setDisasterType: (types) =>
    set((state) => ({ assessment: { ...state.assessment, disasterType: types } })),

  setDisasterDetails: (details) =>
    set((state) => ({ assessment: { ...state.assessment, disasterDetails: details } })),

  setLocation: (location) =>
    set((state) => ({ assessment: { ...state.assessment, location } })),

  setCanEvacuate: (canEvacuate) =>
    set((state) => ({ assessment: { ...state.assessment, canEvacuate } })),

  setPeople: (adults, children) =>
    set((state) => ({ assessment: { ...state.assessment, adults, children } })),

  setMedicalConditions: (conditions) =>
    set((state) => ({ assessment: { ...state.assessment, medicalConditions: conditions } })),

  setMedications: (meds) =>
    set((state) => ({ assessment: { ...state.assessment, medications: meds } })),

  setPets: (pets) =>
    set((state) => ({ assessment: { ...state.assessment, pets } })),

  setPowerStatus: (status) =>
    set((state) => ({ assessment: { ...state.assessment, powerStatus: status } })),

  setWaterStatus: (status) =>
    set((state) => ({ assessment: { ...state.assessment, waterStatus: status } })),

  setCommunications: (comms) =>
    set((state) => ({ assessment: { ...state.assessment, communications: comms } })),

  setSupplies: (supplies) =>
    set((state) => ({ assessment: { ...state.assessment, supplies: supplies } })),

  setHoursElapsed: (hours) =>
    set((state) => ({ assessment: { ...state.assessment, hoursElapsed: hours } })),

  resetAssessment: () =>
    set({ assessment: { ...defaultAssessment }, currentStep: 1 }),

  startSession: async () => {
    set({ sessionStatus: "creating" })
    // Simulated session creation - in production this calls POST /api/session
    await new Promise((r) => setTimeout(r, 1000))
    set({ sessionStatus: "active", agents: { ...defaultAgents } })
  },

  setSessionId: (id) => set({ sessionId: id }),
  setSessionStatus: (status) => set({ sessionStatus: status }),

  updateAgent: (name, update) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [name]: { ...state.agents[name], ...update },
      },
    })),

  setActionPlan: (plan) => set({ actionPlan: plan }),
  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
  setPriorityLevel: (level) => set({ priorityLevel: level }),

  resetAll: () =>
    set({
      currentStep: 1,
      assessment: { ...defaultAssessment },
      sessionId: null,
      sessionStatus: "idle",
      agents: { ...defaultAgents },
      actionPlan: null,
      elapsedSeconds: 0,
      priorityLevel: null,
    }),
}))
