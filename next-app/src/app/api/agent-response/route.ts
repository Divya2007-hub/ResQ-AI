import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

function generateFallback(agentName: string, assessment: any): { text: string; verdict: string; severity: string } {
  const disaster = assessment.disasterType?.[0] || "emergency"
  const locationStr = [assessment.location?.city, assessment.location?.state].filter(Boolean).join(", ") || "your area"
  const people = `${assessment.adults || 0} adult${assessment.adults !== 1 ? "s" : ""}${assessment.children > 0 ? `, ${assessment.children} child${assessment.children !== 1 ? "ren" : ""}` : ""}`
  const moveStatus = assessment.canEvacuate ? "can evacuate" : "must shelter in place"
  const meds = assessment.medicalConditions?.length > 0 ? assessment.medicalConditions.join(", ") : "none reported"
  const suppliesList = assessment.supplies?.filter((s: string) => s !== "None of the above").join(", ") || "none reported"

  if (agentName === "safety") {
    const action = disaster === "earthquake"
      ? "!!! DROP, COVER, AND HOLD ON. Get under sturdy furniture. Stay away from windows."
      : disaster === "tornado"
      ? "!!! TAKE COVER IMMEDIATELY. Go to basement or lowest interior room with no windows."
      : disaster === "wildfire"
      ? "!!! EVACUATE IMMEDIATELY if advised. Close windows/doors. Wear N95 mask if available."
      : disaster === "flooding" || disaster === "tsunami"
      ? "!!! MOVE TO HIGHER GROUND IMMEDIATELY. Do not drive through flood waters."
      : disaster === "hurricane"
      ? "!!! SHELTER IN INTERIOR ROOM away from windows. Stay inside until all-clear."
      : disaster === "chemical-spill"
      ? "!!! SEAL THE ROOM. Close all windows, doors, vents. Turn off HVAC."
      : disaster === "power-outage" || disaster === "winter-storm"
      ? "!!! CONSERVE HEAT. Layer clothing. NEVER use generators or grills indoors."
      : "!!! STAY ALERT and follow local emergency instructions."

    const afterQuake = disaster === "earthquake" ? "\nAfter shaking stops: check for injuries, gas leaks. Expect aftershocks.\n" : "\n"
    return {
      text: `INITIAL ASSESSMENT: ${disaster.toUpperCase()} detected in ${locationStr}.\nYour status: ${people} — ${moveStatus}.\n\n${action}${afterQuake}\nMonitor local alerts for updates.\n\nPRIORITY: ${assessment.canEvacuate ? "Identify safest evacuation route away from affected area." : "Stay in interior room. Prepare for extended wait."}\nRecommended meeting point: Nearest community shelter or higher ground.`,
      verdict: assessment.canEvacuate ? "EVACUATE NOW" : "SHELTER IN PLACE",
      severity: "critical",
    }
  }

  if (agentName === "medical") {
    const c = [
      "MEDICAL PROTOCOL INITIALIZED.\n",
      `Medical conditions reported: ${meds}\n`,
      assessment.medications ? `Critical medications: ${assessment.medications}\n` : "",
      "\nPRIORITY ACTIONS:\n",
      "- Gather all prescription medications and first aid supplies\n",
      "- Keep medications in waterproof container\n",
    ]
    if (assessment.medicalConditions?.some((x: string) => x.includes("Diabetes"))) {
      c.push("- Monitor blood sugar every 4-6 hours. Insulin stable 28 days unrefrigerated.\n")
    }
    if (assessment.medicalConditions?.some((x: string) => x.includes("Asthma"))) {
      c.push("- Keep rescue inhaler accessible. Avoid dust/smoke.\n")
    }
    if (assessment.medicalConditions?.some((x: string) => x.includes("Heart"))) {
      c.push("- Watch for chest pain, shortness of breath. Keep heart medications accessible.\n")
    }
    if (assessment.children > 0) {
      c.push("- Comfort and reassure children. Keep them warm and hydrated.\n")
    }
    c.push("\nFIRST AID KIT CHECKLIST:\n")
    c.push("- Bandages, antiseptic wipes, medical tape\n")
    c.push("- Pain relievers, antihistamines\n")
    c.push("- Any prescription medications")
    const hasConditions = assessment.medicalConditions?.length > 0 && !assessment.medicalConditions.includes("None")
    return {
      text: c.filter(Boolean).join(""),
      verdict: hasConditions ? "MEDICAL: ATTENTION NEEDED" : "MEDICAL: STABLE",
      severity: hasConditions ? "elevated" : "stable",
    }
  }

  if (agentName === "comms") {
    const noComms = !assessment.communications?.length || assessment.communications.includes("No connectivity")
    return {
      text: `COMMUNICATIONS STATUS: ${noComms ? "NO CONNECTION" : "DEGRADED"}\n${assessment.powerStatus === "none" ? "No power detected." : assessment.powerStatus === "generator" ? "Limited power available." : "Power available."}\n${assessment.communications?.length > 0 ? `Available: ${assessment.communications.join(", ")}.` : "No communication methods reported."}\n\nRECOMMENDED CONTACT STRATEGY:\n- Try SMS when signal available\n\nFAMILY MESSAGE TEMPLATE:\n"Safe. ${disaster} at ${locationStr}. ${assessment.canEvacuate ? "Evacuating to safety." : "Sheltering in place."} Will update when possible. Meet at pre-arranged meeting point if separated."\n\nCharge devices now. Use power bank / car charger if available.`,
      verdict: noComms ? "COMMS: DOWN" : "COMMS: DEGRADED",
      severity: noComms ? "critical" : "elevated",
    }
  }

  if (agentName === "resources") {
    const hasFood = assessment.supplies?.includes("Food (3+ days)") || assessment.supplies?.includes("Food (<3 days)")
    const hasWater = assessment.supplies?.includes("Water (3+ gal)") || assessment.supplies?.includes("Water (<3 gal)")
    const hasFirstAid = assessment.supplies?.includes("First aid kit")
    const hasFlashlight = assessment.supplies?.includes("Flashlight")
    const hasRadio = assessment.supplies?.includes("Radio")
    return {
      text: `RESOURCE INVENTORY:\n${suppliesList !== "none reported" ? `Available: ${suppliesList}.` : "No supplies reported."}\n\nCRITICAL GAPS:\n${hasFirstAid ? "" : "- First aid kit needed\n"}${hasFlashlight ? "" : "- Flashlight needed\n"}${hasFood ? "" : "- Food supplies needed\n"}${hasWater ? "" : "- Drinking water needed\n"}${hasRadio ? "" : "- Battery-powered radio needed\n"}\nRECOMMENDED ACTIONS:\n1. Conserve phone battery — reduce screen brightness\n2. ${assessment.waterStatus === "stored" || assessment.waterStatus === "running" ? "Ration water: 1 gallon per person per day" : "Find clean water source — boil if uncertain"}\n3. Inventory all food and prioritize high-calorie items`,
      verdict: suppliesList !== "none reported" ? "RESOURCES: LIMITED" : "RESOURCES: CRITICAL",
      severity: suppliesList !== "none reported" ? "elevated" : "critical",
    }
  }

  if (agentName === "recovery") {
    return {
      text: `RECOVERY ROADMAP INITIALIZED.\n\nPhase 1 (0-6 hours): ${assessment.canEvacuate ? "Evacuate to safety" : "Secure shelter in place"}. Complete safety actions.\n\nPhase 2 (6-24 hours): Assess surroundings. Do not re-enter damaged structures until officials confirm safety.\n\nPhase 3 (24-48 hours): Contact insurance provider. Document all damage with photos if possible.\n\nPhase 4 (3-7 days): Secure temporary housing if needed. Register with FEMA or local disaster relief organizations.\n\nPhase 5 (7+ days): Begin long-term recovery planning. Seek community support and mental health resources.`,
      verdict: "RECOVERY: PLANNED",
      severity: "stable",
    }
  }

  return { text: "Agent unavailable.", verdict: "UNAVAILABLE", severity: "stable" }
}

export async function POST(request: Request) {
  try {
    const { agentName, assessment } = await request.json()
    const agentPrompt = agentPrompts[agentName as string]
    if (!agentPrompt) {
      const fallback = generateFallback(agentName, assessment)
      return NextResponse.json(fallback)
    }

    const assessmentSummary = `
Disaster type: ${assessment.disasterType?.join(", ") || "Not specified"}
Location: ${assessment.location?.city || ""}, ${assessment.location?.state || ""} ${assessment.location?.country || ""}
Can evacuate: ${assessment.canEvacuate ? "Yes" : "No"}
People: ${assessment.adults || 0} adults, ${assessment.children || 0} children
Medical conditions: ${assessment.medicalConditions?.join(", ") || "None"}
Medications: ${assessment.medications || "None"}
Pets: ${(assessment.pets || []).reduce((s: number, p: any) => s + (p.count || 0), 0)} pets
Power: ${assessment.powerStatus || "Not reported"}
Water: ${assessment.waterStatus || "Not reported"}
Communications: ${assessment.communications?.join(", ") || "Not reported"}
Supplies: ${assessment.supplies?.filter((s: string) => s !== "None of the above").join(", ") || "Not reported"}
Hours elapsed: ${assessment.hoursElapsed || 0}
`

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
      const result = await model.generateContent({
        systemInstruction: `You are a disaster response AI assistant. Generate a concise emergency briefing for the given agent role. Use ALL CAPS for severity labels and critical warnings. Keep response under 15 lines. Be direct, urgent, and calm — like a trained emergency coordinator.`,
        contents: [{ role: "user", parts: [{ text: `${agentPrompt}\n\nUser Assessment:\n${assessmentSummary}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
      })
      const text = result.response.text()
      const fallback = generateFallback(agentName, assessment)
      return NextResponse.json({ text, verdict: fallback.verdict, severity: fallback.severity })
    } catch {
      // Gemini failed — use template fallback
      const fallback = generateFallback(agentName, assessment)
      return NextResponse.json(fallback)
    }
  } catch (error: any) {
    console.error("Agent response error:", error)
    const fallback = generateFallback("safety", {})
    return NextResponse.json({ text: "Unable to generate personalized briefing. Please check your connection and try again.", verdict: "ERROR", severity: "elevated" })
  }
}

const agentPrompts: Record<string, string> = {
  safety: `Generate a SAFETY briefing based on the user's assessment data.
Start with "INITIAL ASSESSMENT:" then the disaster type and location.
State the number of adults/children and whether they can evacuate.
Give the CRITICAL first action (DROP-COVER-HOLD for earthquake, EVACUATE for flood, etc.).
List 2-3 specific safety actions.
End with priority and recommended meeting point.`,

  medical: `Generate a MEDICAL briefing.
State any medical conditions reported or "none reported".
If no conditions, list first aid kit essentials.
If conditions exist (Diabetes, Asthma, Heart, etc.), give 2-3 specific management tips for each.
List any medications.
Keep it practical for an emergency setting.`,

  comms: `Generate a COMMUNICATIONS briefing based on power/comms status.
State if power is available, limited, or none.
List available communication methods.
If limited, recommend SMS-first strategy.
Provide a family message template with the actual location and disaster type.
End with advice on charging devices.`,

  resources: `Generate a RESOURCE briefing based on reported supplies.
List what the user has.
List critical gaps (first aid kit, flashlight, food, water, radio).
Give 2-3 recommended actions for conserving/rationing supplies.`,

  recovery: `Generate a RECOVERY ROADMAP with 5 phases:
Phase 1 (0-6 hrs): Immediate safety actions based on disaster type
Phase 2 (6-24 hrs): Assessment and damage documentation
Phase 3 (24-48 hrs): Insurance and temporary housing
Phase 4 (3-7 days): FEMA/disaster relief registration
Phase 5 (7+ days): Long-term recovery and mental health`,
}
