"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ShieldAlert, HeartPulse, Radio, Package, TrendingUp,
  Download, Share2, Printer, RotateCcw, ChevronDown,
  Copy, MapPin, Clock, AlertTriangle, CheckCircle,
  Zap, BatteryCharging, PawPrint, Coffee, Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PriorityBar } from "@/components/plan/PriorityBar"
import { ResourceChecklist } from "@/components/plan/ResourceChecklist"
import { SeverityBadge } from "@/components/common/SeverityBadge"
import { useEmergencyStore } from "@/lib/store"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

const sections = [
  { id: "priority-assessment", label: "Priority Assessment" },
  { id: "immediate-actions", label: "Immediate Actions (0–1 hr)" },
  { id: "medical-protocols", label: "Medical Protocols" },
  { id: "communication-plan", label: "Communication Plan" },
  { id: "resource-checklist", label: "Resource Checklist" },
  { id: "recovery-roadmap", label: "Recovery Roadmap" },
]

export default function ActionPlanPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const store = useEmergencyStore()
  const [activeSection, setActiveSection] = useState("priority-assessment")

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setMounted(true) }, [])

  const a = store.assessment
  const disasterType = a.disasterType[0] || "emergency"
  const locationStr = [a.location.city, a.location.state].filter(Boolean).join(", ") || "your location"
  const people = a.adults + " adult" + (a.adults !== 1 ? "s" : "") + (a.children > 0 ? ", " + a.children + " child" + (a.children !== 1 ? "ren" : "") : "")
  const criticalDisasters = ["earthquake", "flooding", "tornado", "tsunami", "wildfire", "hurricane", "chemical-spill"]
  const elevatedDisasters = ["power-outage", "winter-storm", "structural", "civil-unrest", "medical"]
  const computedPriority: "critical" | "elevated" = criticalDisasters.includes(disasterType) ? "critical" : "elevated"
  const hasMedical = a.medicalConditions.length > 0 && !a.medicalConditions.includes("None")
  const hasPower = a.powerStatus === "full"
  const hasWater = a.waterStatus === "running" || a.waterStatus === "stored"
  const hasComms = !a.communications.includes("No connectivity")
  const supplyCount = a.supplies.filter((s) => s !== "None of the above").length
  const daysOfSupplies = a.supplies.includes("Food (3+ days)") || a.supplies.includes("Water (3+ gal)") ? 3 : a.supplies.includes("Food (<3 days)") || a.supplies.includes("Water (<3 gal)") ? 1 : 0

  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(
    a.location.lat && a.location.lng ? { lat: a.location.lat, lng: a.location.lng } : null
  )

  // Geocode city name if lat/lng not available
  useEffect(() => {
    if (mapCoords) return
    const query = [a.location.city, a.location.state, a.location.country].filter(Boolean).join(",")
    if (!query) return
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.lat && data?.[0]?.lon) {
          setMapCoords({ lat: Number(data[0].lat), lng: Number(data[0].lon) })
        }
      })
      .catch(() => {})
  }, [])

  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  // Build immediate actions based on assessment
  const immediateActions = (() => {
    const items: { num: string; icon: any; color: string; title: string; desc: string; time: string; severity: "CRITICAL" | "URGENT" | "IMPORTANT" | "ADVISORY" }[] = []

    if (disasterType === "flooding" || disasterType === "tsunami" || disasterType === "hurricane") {
      const dd = disasterType === "tsunami" ? "Tsunami" : disasterType === "hurricane" ? "Storm surge" : "Flood"
      items.push({ num: "01", icon: ShieldAlert, color: "text-critical", title: "MOVE TO HIGHER GROUND", desc: dd + " is imminent. Move to the highest level of your building immediately.", time: "Right now", severity: "CRITICAL" })
    } else if (disasterType === "tornado") {
      items.push({ num: "01", icon: ShieldAlert, color: "text-critical", title: "TAKE COVER IMMEDIATELY", desc: "Go to the lowest level — basement or interior room with no windows. Cover your head and neck.", time: "Right now", severity: "CRITICAL" })
    } else if (disasterType === "earthquake") {
      items.push({ num: "01", icon: ShieldAlert, color: "text-critical", title: "DROP, COVER, AND HOLD ON", desc: "Drop to the ground, take cover under sturdy furniture, and hold on until shaking stops. Stay away from windows.", time: "Right now", severity: "CRITICAL" })
    } else if (disasterType === "wildfire") {
      items.push({ num: "01", icon: ShieldAlert, color: "text-critical", title: "EVACUATE IF ADVISED", desc: "If evacuation is ordered, leave immediately. Close all windows and doors. Wear N95 mask if available.", time: "Right now", severity: "CRITICAL" })
    } else if (disasterType === "chemical-spill") {
      items.push({ num: "01", icon: ShieldAlert, color: "text-critical", title: "SEAL THE ROOM", desc: "Close all windows, doors, and vents. Turn off HVAC. Seal gaps with wet towels or tape.", time: "Right now", severity: "CRITICAL" })
    } else if (disasterType === "power-outage" || disasterType === "winter-storm") {
      items.push({ num: "01", icon: AlertTriangle, color: "text-critical", title: "CONSERVE HEAT AND POWER", desc: "Layer clothing, seal off unused rooms, and use blankets. Do NOT use generators or grills indoors.", time: "Right now", severity: "CRITICAL" })
    } else {
      items.push({ num: "01", icon: ShieldAlert, color: "text-critical", title: "ENSURE IMMEDIATE SAFETY", desc: "Assess your surroundings and move to the safest area possible. Stay alert for changing conditions.", time: "Right now", severity: "CRITICAL" })
    }

    if (a.canEvacuate) {
      items.push({ num: "02", icon: Package, color: "text-warning", title: "PREPARE EVACUATION BAG", desc: "Pack: medications, phone chargers, power bank, ID docs, flashlight, cash, water, snacks." + (hasMedical ? " Include prescription meds and medical devices." : ""), time: "Within 15 minutes", severity: "URGENT" })
    }
    if (hasPower) {
      items.push({ num: "0" + (items.length + 1), icon: Zap, color: "text-warning", title: "UNPLUG NON-ESSENTIAL APPLIANCES", desc: "Unplug electronics to protect against power surges. Do not touch switches if standing in water.", time: "Within 15 minutes", severity: "URGENT" })
    }
    if (!hasPower) {
      items.push({ num: "0" + (items.length + 1), icon: BatteryCharging, color: "text-warning", title: "CONSERVE BATTERY POWER", desc: "Charge all devices now. Use power banks. Reduce phone brightness and close unused apps.", time: "Within 15 minutes", severity: "URGENT" })
    }
    if (hasMedical) {
      items.push({ num: "0" + (items.length + 1), icon: HeartPulse, color: "text-warning", title: "SECURE MEDICAL SUPPLIES", desc: "Gather: " + a.medicalConditions.filter((c) => c !== "None").join(", ") + " supplies." + (a.medications ? " Medications: " + a.medications + "." : ""), time: "Within 30 minutes", severity: "URGENT" })
    }
    if (a.pets.length > 0) {
      const petCount = a.pets.reduce((s, p) => s + p.count, 0)
      items.push({ num: "0" + (items.length + 1), icon: PawPrint, color: "text-warning", title: "PREPARE PETS", desc: "Prepare for " + petCount + " pet(s). Pack food, water, leash/carrier, and any medications.", time: "Within 30 minutes", severity: "URGENT" })
    }
    if (!a.communications.includes("Cell phone") && !a.communications.includes("Radio")) {
      items.push({ num: "0" + (items.length + 1), icon: Radio, color: "text-brand", title: "ESTABLISH COMMUNICATIONS", desc: "Send SMS to family with your location and status. Use text instead of calls to conserve battery.", time: "Within 1 hour", severity: "IMPORTANT" })
    }
    if (daysOfSupplies < 2) {
      items.push({ num: "0" + (items.length + 1), icon: Coffee, color: "text-brand", title: "RATION SUPPLIES", desc: "You reported limited supplies. Conserve food and water. Fill bathtubs and containers with water if possible.", time: "Within 1 hour", severity: "IMPORTANT" })
    }

    return items
  })()

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleDownloadPDF = () => {
    toast.success("Generating PDF for print...")
    window.print()
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ResQ AI Emergency Action Plan",
          text: `Emergency Action Plan — Session #${sessionId}`,
          url,
        })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Plan link copied to clipboard")
    }
  }

  // Track active section on scroll via IntersectionObserver
  useEffect(() => {
    const sectionIds = sections.map((s) => s.id)
    const observers: IntersectionObserver[] = []

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id)
            }
          })
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="critical" className="text-[10px] tracking-wider">EMERGENCY ACTION PLAN</Badge>
            <span className="font-mono text-xs text-text-3">Session #{sessionId}</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-text mb-3">
            {store.actionPlan?.disasterType || "Emergency Action Plan"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand" />
              {store.actionPlan?.location || "Location set"}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand" />
              Generated: {mounted ? formatDate(new Date()) : "Loading..."}
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {store.actionPlan?.groupInfo || "No group info"}
            </Badge>
          </div>
        </div>

        {/* Priority bar */}
        <PriorityBar level={store.priorityLevel || computedPriority} />

        <div className="mt-8 flex gap-8">
          {/* Sidebar navigation */}
          <aside className="hidden lg:block w-[260px] shrink-0">
            <nav className="sticky top-24 space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-text-3 mb-3">
                Plan Navigation
              </p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-brand/10 text-brand font-medium"
                      : "text-text-2 hover:text-text hover:bg-surface-2"
                  }`}
                >
                  {section.label}
                </button>
              ))}
              <Separator className="my-4" />
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={handleDownloadPDF}>
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </Button>
              <Button variant="ghost" size="sm" className="w-full gap-2 text-xs" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5" />
                Share Plan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => router.push("/assess")}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Assessment
              </Button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-10 min-w-0">
            {/* Section 1: Priority Assessment */}
            <section id="priority-assessment">
              <h2 className="font-display font-semibold text-xl text-text mb-6">
                Priority Assessment
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="border-l-4 border-l-critical">
                  <CardContent className="p-4">
                    <p className="text-[11px] font-mono text-text-3 tracking-wider">IMMEDIATE RISK</p>
                    <p className="font-display font-bold text-lg text-critical mt-1">CRITICAL</p>
                    <p className="text-xs text-text-2 mt-1 capitalize">{disasterType} in progress</p>
                  </CardContent>
                </Card>
                <Card className={`border-l-4 ${hasMedical ? "border-l-warning" : "border-l-stable"}`}>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-mono text-text-3 tracking-wider">MEDICAL RISK</p>
                    <p className={`font-display font-bold text-lg mt-1 ${hasMedical ? "text-warning" : "text-stable"}`}>
                      {hasMedical ? "ELEVATED" : "STABLE"}
                    </p>
                    <p className="text-xs text-text-2 mt-1">{hasMedical ? a.medicalConditions.filter((c) => c !== "None").join(", ") : "No conditions reported"}</p>
                  </CardContent>
                </Card>
                <Card className={`border-l-4 ${hasComms ? "border-l-stable" : "border-l-warning"}`}>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-mono text-text-3 tracking-wider">COMMS STATUS</p>
                    <p className={`font-display font-bold text-lg mt-1 ${hasComms ? "text-stable" : "text-warning"}`}>
                      {hasComms ? "ACTIVE" : "DEGRADED"}
                    </p>
                    <p className="text-xs text-text-2 mt-1">{a.communications.join(", ") || "None available"}</p>
                  </CardContent>
                </Card>
                <Card className={`border-l-4 ${supplyCount > 3 ? "border-l-stable" : "border-l-warning"}`}>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-mono text-text-3 tracking-wider">RESOURCE STATUS</p>
                    <p className={`font-display font-bold text-lg mt-1 ${supplyCount > 3 ? "text-stable" : "text-warning"}`}>
                      {supplyCount > 3 ? "ADEQUATE" : "LIMITED"}
                    </p>
                    <p className="text-xs text-text-2 mt-1">{daysOfSupplies > 0 ? `${daysOfSupplies}-day supplies` : "No supplies reported"}</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-surface-2 border-border">
                <CardContent className="p-5">
                  <p className="text-sm text-text-2 leading-relaxed">
                    {disasterType === "winter-storm" ? "Winter storm conditions are active in your area. Extreme cold and potential power outages are expected. "
                    : disasterType === "earthquake" ? "Earthquake has occurred. Aftershocks are possible. Stay away from damaged structures. "
                    : disasterType === "wildfire" ? "Wildfire is active in your region. Smoke inhalation is a serious risk. Evacuate if advised. "
                    : disasterType === "flooding" ? "Flood levels are actively rising in your area. Immediate evacuation to higher ground is strongly recommended. "
                    : disasterType === "hurricane" ? "Hurricane conditions are present. Strong winds and heavy rainfall expected. Shelter in a interior room. "
                    : disasterType === "tornado" ? "Tornado warning in effect. Take cover immediately in the lowest level of your building. "
                    : disasterType === "power-outage" ? "Widespread power outage detected. Conserve battery power and food supplies. "
                    : disasterType === "tsunami" ? "Tsunami warning issued. Move to high ground immediately — do not wait. "
                    : disasterType === "chemical-spill" ? "Chemical spill reported. Seal windows and doors. Do not go outside. "
                    : disasterType === "structural" ? "Structural damage reported. Evacuate the building immediately. "
                    : disasterType === "medical" ? "Medical emergency in progress. Seek professional medical help immediately. "
                    : disasterType === "civil-unrest" ? "Civil unrest in your area. Stay indoors and avoid all gatherings. "
                    : `${disasterType} situation in progress. `}
                    {a.canEvacuate ? "Evacuation is possible — prepare to move if conditions worsen." : "Shelter in place advised — stay in the safest area of your location."}
                    {hasMedical ? " Medical needs identified — ensure medications are accessible." : ""}
                    {!hasComms ? " Communications are limited — prepare offline backup plans." : ""}
                    {daysOfSupplies === 0 ? " No food or water supplies reported — prioritize finding these immediately." : daysOfSupplies < 3 ? " Food and water supplies are limited — ration carefully." : ""}
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Immediate Actions */}
            <section id="immediate-actions">
              <h2 className="font-display font-semibold text-xl text-text mb-6">
                Immediate Actions (0–1 hour)
              </h2>
              <div className="space-y-4">
                {immediateActions.map((item) => {
                    const Icon = item.icon
                    const severityColor = {
                      CRITICAL: "bg-critical/10 text-critical border-critical/20",
                      URGENT: "bg-warning/10 text-warning border-warning/20",
                      IMPORTANT: "bg-info/10 text-info border-info/20",
                      ADVISORY: "bg-stable/10 text-stable border-stable/20",
                    }[item.severity]

                    return (
                      <motion.div
                        key={item.num}
                        whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
                        className="bg-surface border border-border rounded-radius-card p-5 relative overflow-hidden"
                      >
                        <span className="absolute -top-6 -left-2 font-display font-bold text-[80px] text-text-3/5 select-none">
                          {item.num}
                        </span>
                        <div className="flex items-start gap-4 relative">
                          <Icon className={`w-5 h-5 mt-0.5 ${item.color} shrink-0`} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-display font-semibold text-base text-text">
                                {item.title}
                              </h3>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-pill border whitespace-nowrap ${severityColor}`}>
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-sm text-text-2 mt-1.5 leading-relaxed">{item.desc}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Clock className="w-3 h-3 text-text-3" />
                              <span className="text-[11px] font-mono text-text-3">{item.time}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                }
              </div>
            </section>

            {/* Section 3: Medical Protocols */}
            <section id="medical-protocols">
              <h2 className="font-display font-semibold text-xl text-text mb-6">
                Medical Protocols
              </h2>
              {hasMedical ? (
                <div className="space-y-4">
                  {a.medicalConditions.filter((c) => c !== "None").map((condition) => (
                    <Card key={condition} className="border-l-4 border-l-warning">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <HeartPulse className="w-5 h-5 text-warning mt-0.5" />
                          <div className="w-full">
                            <h3 className="font-display font-semibold text-base text-text mb-1">
                              {condition === "Diabetes" ? "Diabetes Management During Emergency"
                              : condition === "Asthma" ? "Asthma Management During Emergency"
                              : condition === "Heart condition" ? "Heart Condition Management During Emergency"
                              : condition === "Mobility issues" ? "Mobility Needs During Emergency"
                              : condition === "Allergies" ? "Allergy Management During Emergency"
                              : `${condition} — Emergency Protocol`}
                            </h3>
                            <div className="space-y-2 text-sm text-text-2">
                              {condition === "Diabetes" && <>
                                <p><span className="text-text font-medium">Priority medications:</span> Insulin, glucose meter, test strips, glucagon kit</p>
                                <p><span className="text-text font-medium">Blood sugar monitoring:</span> Check every 4-6 hours. Stress can increase blood sugar.</p>
                                <p><span className="text-text font-medium">Insulin storage:</span> Unrefrigerated insulin remains stable for 28 days at room temperature.</p>
                                <p><span className="text-text font-medium">Signs to watch for:</span> Dizziness, confusion, rapid breathing, fruity breath odor</p>
                              </>}
                              {condition === "Asthma" && <>
                                <p><span className="text-text font-medium">Priority medications:</span> Rescue inhaler (albuterol), spacer if available</p>
                                <p><span className="text-text font-medium">Monitoring:</span> Watch for wheezing, chest tightness, shortness of breath</p>
                                <p><span className="text-text font-medium">Precautions:</span> Avoid smoke, dust, and mold. Cover mouth and nose with a cloth if air quality is poor.</p>
                                <p><span className="text-text font-medium">When to seek emergency care:</span> Inhaler provides no relief after 4 puffs, difficulty speaking, blue lips</p>
                              </>}
                              {condition === "Heart condition" && <>
                                <p><span className="text-text font-medium">Priority medications:</span> Blood pressure meds, aspirin, nitroglycerin (if prescribed), beta blockers</p>
                                <p><span className="text-text font-medium">Monitoring:</span> Watch for chest pain, shortness of breath, irregular heartbeat. Stress can exacerbate symptoms.</p>
                                <p><span className="text-text font-medium">Precautions:</span> Avoid heavy lifting or strenuous activity. Stay calm and rest.</p>
                                <p><span className="text-text font-medium">When to seek emergency care:</span> Chest pain lasting more than 5 minutes, difficulty breathing, fainting</p>
                              </>}
                              {condition === "Mobility issues" && <>
                                <p><span className="text-text font-medium">Equipment:</span> Wheelchair, walker, cane, crutches — keep within reach at all times</p>
                                <p><span className="text-text font-medium">Evacuation plan:</span> Identify accessible exits. Ask for assistance if needed. Pre-register with local emergency services if possible.</p>
                                <p><span className="text-text font-medium">Medications:</span> Ensure pain medications and any mobility-related prescriptions are packed.</p>
                              </>}
                              {condition === "Allergies" && <>
                                <p><span className="text-text font-medium">Priority medications:</span> EpiPen (epinephrine auto-injector), antihistamines (Benadryl, Zyrtec)</p>
                                <p><span className="text-text font-medium">Avoid triggers:</span> Smoke, mold, dust, and certain foods — more common in emergency shelters.</p>
                                <p><span className="text-text font-medium">When to seek emergency care:</span> Difficulty breathing, swelling of throat/tongue, hives spreading rapidly</p>
                              </>}
                              {!"Diabetes,Asthma,Heart condition,Mobility issues,Allergies".includes(condition) && <>
                                <p><span className="text-text font-medium">Priority medications:</span> Ensure all prescriptions are packed and accessible.</p>
                                <p><span className="text-text font-medium">Medical documentation:</span> Keep a copy of medical records, doctor contact, and insurance info.</p>
                                <p><span className="text-text font-medium">Emergency contact:</span> Have a family member or caregiver's contact information ready.</p>
                              </>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {a.medications && (
                    <Card className="bg-surface-2 border-border">
                      <CardContent className="p-4">
                        <p className="text-[11px] font-mono text-text-3 tracking-wider mb-2">REPORTED MEDICATIONS</p>
                        <div className="flex flex-wrap gap-2">
                          {a.medications.split(",").map((med) => (
                            <Badge key={med} variant="secondary">{med.trim()}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-surface-2 border-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-text-2 leading-relaxed">
                      No medical conditions were reported. If you or someone in your household has a medical
                      condition, update your assessment or consult with emergency medical services.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Section 4: Communication Plan */}
            <section id="communication-plan">
              <h2 className="font-display font-semibold text-xl text-text mb-6">
                Communication Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-brand">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Radio className="w-4 h-4 text-brand" />
                      <h3 className="font-display font-semibold text-sm text-text">Family Contact</h3>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3 text-xs text-text-2 font-mono leading-relaxed mb-3">
                      Safe. We&apos;re at {locationStr}. {disasterType === "flooding" || disasterType === "hurricane" || disasterType === "tsunami" ? "Water levels rising." : disasterType === "wildfire" ? "Smoke in area." : disasterType === "earthquake" ? "Building damaged." : "Emergency in area."} Will update when possible. Meet at pre-arranged location if separated.
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={() => handleCopy("Safe. We're at " + locationStr + ". " + (disasterType === "flooding" || disasterType === "hurricane" || disasterType === "tsunami" ? "Water levels rising." : disasterType === "wildfire" ? "Smoke in area." : disasterType === "earthquake" ? "Building damaged." : "Emergency in area.") + " Will update when possible. Meet at pre-arranged location if separated.")}
                    >
                      <Copy className="w-3 h-3" />
                      Copy Message
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-brand">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Radio className="w-4 h-4 text-brand" />
                      <h3 className="font-display font-semibold text-sm text-text">Emergency Broadcast</h3>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3 text-xs text-text-2 font-mono leading-relaxed mb-3">
                      EMERGENCY: {disasterType.charAt(0).toUpperCase() + disasterType.slice(1)} at {locationStr}. {people} present.{hasMedical ? " Medical needs: " + a.medicalConditions.filter((c) => c !== "None").join(", ") + "." : ""} Contact: [phone].
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={() => handleCopy("EMERGENCY: " + disasterType.charAt(0).toUpperCase() + disasterType.slice(1) + " at " + locationStr + ". " + people + " present." + (hasMedical ? " Medical needs: " + a.medicalConditions.filter((c) => c !== "None").join(", ") + "." : "") + " Contact: [phone].")}
                    >
                      <Copy className="w-3 h-3" />
                      Copy Template
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-brand">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Radio className="w-4 h-4 text-brand" />
                      <h3 className="font-display font-semibold text-sm text-text">Offline Backup</h3>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3 text-xs text-text-2 font-mono leading-relaxed mb-3">
                      Primary meeting point: [Designate a safe location near {locationStr}]. Secondary: [Nearest school or community center]. Evacuation route: {disasterType === "flooding" || disasterType === "tsunami" ? "Head to higher ground" : "Follow official evacuation routes"}.
                    </div>
                    <div id="offline-map" className="mb-3 rounded-lg overflow-hidden border border-border">
                      {mapCoords ? (
                        <iframe
                          title="Google Map"
                          src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=15&output=embed`}
                          width="100%"
                          height="300"
                          className="border-0"
                          loading="lazy"
                        />
                      ) : (
                        <svg viewBox="0 0 400 260" className="w-full h-auto font-mono bg-surface-2">
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-border" strokeWidth="0.5" opacity="0.3"/>
                            </pattern>
                          </defs>
                          <rect width="400" height="260" fill="currentColor" className="text-surface-2" />
                          <rect width="400" height="260" fill="url(#grid)" />
                          <g transform="translate(60, 55)">
                            <circle cx="0" cy="0" r="24" fill="none" stroke="currentColor" className="text-text-3" strokeWidth="0.5"/>
                            <text x="0" y="-18" textAnchor="middle" fill="currentColor" className="text-text" fontSize="9" fontWeight="bold">N</text>
                            <text x="0" y="26" textAnchor="middle" fill="currentColor" className="text-text-3" fontSize="7">S</text>
                            <text x="18" y="4" textAnchor="middle" fill="currentColor" className="text-text-3" fontSize="7">E</text>
                            <text x="-18" y="4" textAnchor="middle" fill="currentColor" className="text-text-3" fontSize="7">W</text>
                            <polygon points="0,-20 4,-4 0,-8 -4,-4" fill="#ef4444" />
                          </g>
                          <text x="200" y="28" textAnchor="middle" fill="currentColor" className="text-text" fontSize="13" fontWeight="bold">{locationStr.toUpperCase()}</text>
                          <text x="200" y="44" textAnchor="middle" fill="currentColor" className="text-text-2" fontSize="9">LOCATION MAP — PRINT AND KEEP WITH YOU</text>
                          <circle cx="260" cy="120" r="8" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                          <text x="260" y="145" textAnchor="middle" fill="currentColor" className="text-text" fontSize="10" fontWeight="bold">YOUR LOCATION</text>
                          <rect x="20" y="180" width="170" height="65" rx="4" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1"/>
                          <text x="30" y="198" fill="currentColor" className="text-text" fontSize="9" fontWeight="bold">MEETING POINTS</text>
                          <text x="30" y="213" fill="currentColor" className="text-text-2" fontSize="8">Primary: [Nearest shelter]</text>
                          <text x="30" y="228" fill="currentColor" className="text-text-2" fontSize="8">Secondary: [Community center]</text>
                          <text x="30" y="243" fill="currentColor" className="text-text-2" fontSize="8">Route: Follow official evacuation</text>
                          <rect x="270" y="230" width="80" height="3" fill="currentColor" className="text-text-3" />
                          <text x="270" y="246" fill="currentColor" className="text-text-3" fontSize="7">0</text>
                          <text x="350" y="246" textAnchor="end" fill="currentColor" className="text-text-3" fontSize="7">~2 km</text>
                          <rect x="1" y="1" width="398" height="258" fill="none" stroke="currentColor" className="text-border" strokeWidth="1" />
                        </svg>
                      )}
                    </div>
                    <Button variant="default" size="sm" className="w-full gap-2 text-xs" onClick={() => {
                      const q = mapCoords ? `${mapCoords.lat},${mapCoords.lng}` : encodeURIComponent(locationStr)
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=${q}&destination=emergency+shelter&travelmode=walking`, "_blank")
                    }}>
                      <Navigation className="w-3 h-3" />
                      Navigate to Shelter
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 5: Resource Checklist */}
            <section id="resource-checklist">
              <h2 className="font-display font-semibold text-xl text-text mb-6">
                Resource Checklist
              </h2>
              <div className="space-y-4">
                <ResourceChecklist
                  category="critical"
                  items={[
                    ...(hasMedical ? [{ label: "Medications — ensure all prescriptions are packed", checked: false }] : []),
                    ...(!a.supplies.includes("Water (3+ gal)") && !a.supplies.includes("Water (<3 gal)") ? [{ label: "Drinking water — none reported, prioritize immediately", checked: false }] : a.supplies.includes("Water (3+ gal)") ? [{ label: "Bottled water — you have 3+ gallons stored", checked: true }] : [{ label: "Bottled water — you have some stored", checked: true }]),
                    ...(!a.supplies.includes("Food (3+ days)") && !a.supplies.includes("Food (<3 days)") ? [{ label: "Food supplies — none reported, prioritize immediately", checked: false }] : a.supplies.includes("Food (3+ days)") ? [{ label: "Food — you have 3+ days worth", checked: true }] : [{ label: "Food — limited supply (less than 3 days)", checked: true }]),
                    { label: "Flashlights + spare batteries", checked: !!(a.supplies.includes("Flashlight") || a.supplies.includes("Flashlights")) },
                    { label: "Phone fully charged", checked: a.communications.includes("Cell phone") },
                    { label: "Power bank / backup charger", checked: false },
                  ]}
                />
                <ResourceChecklist
                  category="missing"
                  items={[
                    { label: "Battery-powered or hand-crank radio", checked: a.communications.includes("Radio") },
                    { label: "Cash ($200+ small bills)", checked: false },
                    { label: "Physical ID copies (passport, DL, insurance)", checked: false },
                    ...(a.pets.length > 0 ? [{ label: "Pet supplies (food, leash, carrier, meds)", checked: false }] : []),
                  ]}
                />
                <ResourceChecklist
                  category="have"
                  items={[
                    { label: "First aid kit", checked: a.supplies.includes("First aid kit") },
                    { label: "Emergency blankets", checked: a.supplies.includes("Emergency blankets") },
                    { label: "(Add any other supplies you have)", checked: false },
                    { label: "Multi-tool / utility knife", checked: a.supplies.includes("Multi-tool") },
                    { label: "Sanitation supplies (hand sanitizer, wipes)", checked: a.supplies.includes("Hygiene supplies") },
                  ].filter((i) => i.label !== "(Add any other supplies you have)" || true)}
                />
                <Button variant="outline" size="default" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Checklist as PDF
                </Button>
              </div>
            </section>

            {/* Section 6: Recovery Roadmap */}
            <section id="recovery-roadmap">
              <h2 className="font-display font-semibold text-xl text-text mb-6">
                Recovery Roadmap
              </h2>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-border hidden md:block" />

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    {
                      time: "0-6 HRS",
                      title: "Immediate Safety",
                      actions: ["Evacuate to safe location", "Turn off utilities", "Gather emergency supplies"],
                    },
                    {
                      time: "6-24 HRS",
                      title: "Assess Damage",
                      actions: ["Do not re-enter until safe", "Document damage with photos", "Check on neighbors"],
                    },
                    {
                      time: "24-48 HRS",
                      title: "Contact Insurance",
                      actions: ["Call insurance provider", "File initial claim", "Secure temporary housing"],
                    },
                    {
                      time: "3-7 DAYS",
                      title: "Document Losses",
                      actions: ["Register with FEMA/disaster relief", "Detailed inventory of losses", "Begin cleanup"],
                    },
                    {
                      time: "7+ DAYS",
                      title: "Long-term Recovery",
                      actions: ["Repair planning", "Mental health support", "Community rebuilding"],
                    },
                  ].map((phase) => (
                    <Card key={phase.time} className="border-t-2 border-t-brand relative md:pt-8">
                      <CardContent className="p-4">
                        <Badge variant="default" className="mb-2 text-[10px]">{phase.time}</Badge>
                        <h3 className="font-display font-semibold text-sm text-text mb-2">{phase.title}</h3>
                        <ul className="space-y-1">
                          {phase.actions.map((action) => (
                            <li key={action} className="text-xs text-text-2 flex items-start gap-1.5">
                              <CheckCircle className="w-3 h-3 text-brand mt-0.5 shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Export & Share bar (mobile) */}
            <div className="lg:hidden flex flex-wrap gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Share Link
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={() => router.push("/assess")}
              >
                <RotateCcw className="w-4 h-4" /> New Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
