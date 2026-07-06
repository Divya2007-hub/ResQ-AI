"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Pencil, Minus, Plus, Loader2, MapPin, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StepWizard } from "@/components/assessment/StepWizard"
import { DisasterTypeGrid } from "@/components/assessment/DisasterTypeGrid"
import { RadarPing } from "@/components/radar/RadarPing"
import { useEmergencyStore } from "@/lib/store"
import { toast } from "sonner"

const steps = [
  { label: "Situation", shortLabel: "SITUATION" },
  { label: "Location", shortLabel: "LOCATION" },
  { label: "People", shortLabel: "PEOPLE" },
  { label: "Supplies", shortLabel: "SUPPLIES" },
  { label: "Confirm", shortLabel: "CONFIRM" },
]

const medicalChipOptions = [
  "Diabetes", "Heart Condition", "Hypertension", "Asthma / COPD",
  "Mobility Issues", "Pregnancy", "Mental Health", "Elderly (70+)",
  "Infant (<1yr)", "Immunocompromised", "Dialysis", "None",
]

const communicationOptions = [
  "Mobile data", "WiFi", "Landline", "No connectivity", "Satellite",
]

const supplyOptions = [
  "First aid kit", "Flashlight", "Batteries",
  "Food (3+ days)", "Food (<3 days)", "No food stored",
  "Water (3+ gal)", "Water (<3 gal)", "Blankets",
  "Fire extinguisher", "Radio", "Generator",
  "Car / vehicle", "Cash", "Important docs",
  "Medications", "Tools", "None of the above",
]

const TIME_OPTIONS = [0, 1, 6, 24, 72]

export default function AssessPage() {
  const router = useRouter()
  const store = useEmergencyStore()
  const [step, setStep] = useState(store.currentStep)
  const [loading, setLoading] = useState(false)
  const [timeSliderIndex, setTimeSliderIndex] = useState(() => {
    const val = store.assessment.hoursElapsed
    const idx = TIME_OPTIONS.indexOf(val)
    return idx >= 0 ? idx : 0
  })

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
      store.setStep(step + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      store.setStep(step - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleLaunch = async () => {
    setLoading(true)
    await store.startSession()
    const sessionId = `A${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    store.setSessionId(sessionId)
    toast.success("Emergency session created. Assembling response team...")
    router.push(`/response/${sessionId}`)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What are you facing?</CardTitle>
                <CardDescription>Select the type of emergency situation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DisasterTypeGrid
                  selected={store.assessment.disasterType}
                  onSelect={(types) => store.setDisasterType(types)}
                />
                <div>
                  <label className="text-sm text-text-2 block mb-2">
                    Describe additional details (optional)
                  </label>
                  <textarea
                    value={store.assessment.disasterDetails}
                    onChange={(e) => store.setDisasterDetails(e.target.value)}
                    placeholder="e.g., Water is rising rapidly, power lines are down..."
                    rows={3}
                    className="w-full bg-surface-2 border border-border rounded-radius-input px-4 py-3 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand transition-colors resize-none"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button
                variant="default"
                size="lg"
                onClick={handleNext}
                disabled={store.assessment.disasterType.length === 0}
                className="font-semibold gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Where are you?</CardTitle>
                <CardDescription>Your location helps identify local resources and conditions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        toast.error("Geolocation not supported by your browser")
                        return
                      }
                      toast.info("Requesting your location...")
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const { latitude, longitude } = pos.coords
                          // Reverse geocode via OpenStreetMap Nominatim (free, no key needed)
                          try {
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                              { headers: { "Accept-Language": "en" } }
                            )
                            const data = await res.json()
                            const addr = data.address || {}
                            store.setLocation({
                              country: addr.country || "",
                              state: addr.state || addr.region || "",
                              city: addr.city || addr.town || addr.village || addr.municipality || "",
                              landmark: addr.road || addr.suburb || "",
                              lat: latitude,
                              lng: longitude,
                            })
                            toast.success("Location detected")
                          } catch {
                            // Fallback: set coordinates only
                            store.setLocation({
                              country: "",
                              state: "",
                              city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                              lat: latitude,
                              lng: longitude,
                            })
                            toast.success("Coordinates detected (reverse geocode unavailable)")
                          }
                        },
                        (err) => {
                          toast.error(`Location error: ${err.message}`)
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      )
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                    Use my location
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Network className="w-4 h-4" />
                    Enter manually
                  </Button>
                </div>

                {store.assessment.location.city && (
                  <div className="bg-surface-2 rounded-radius-card p-4 border border-border">
                    <p className="text-sm text-text">
                      📍 {store.assessment.location.city}, {store.assessment.location.state}, {store.assessment.location.country}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={store.assessment.location.country}
                    onChange={(e) => store.setLocation({ ...store.assessment.location, country: e.target.value })}
                    placeholder="Country"
                    className="bg-surface-2 border border-border rounded-radius-input px-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand"
                  />
                  <input
                    value={store.assessment.location.state}
                    onChange={(e) => store.setLocation({ ...store.assessment.location, state: e.target.value })}
                    placeholder="State / Region"
                    className="bg-surface-2 border border-border rounded-radius-input px-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand"
                  />
                  <input
                    value={store.assessment.location.city}
                    onChange={(e) => store.setLocation({ ...store.assessment.location, city: e.target.value })}
                    placeholder="City / Neighborhood"
                    className="bg-surface-2 border border-border rounded-radius-input px-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand"
                  />
                </div>
                <input
                  value={store.assessment.location.landmark || ""}
                  onChange={(e) => store.setLocation({ ...store.assessment.location, landmark: e.target.value })}
                  placeholder="Landmark / Street (optional)"
                  className="w-full bg-surface-2 border border-border rounded-radius-input px-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand"
                />

                <Separator />

                <div>
                  <p className="text-sm text-text-2 mb-3">Are you currently able to move?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => store.setCanEvacuate(true)}
                      className={`flex-1 py-3 px-4 rounded-radius-card border text-sm font-medium transition-all ${
                        store.assessment.canEvacuate
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border text-text-2 hover:border-border-strong"
                      }`}
                    >
                      Yes, I can evacuate
                    </button>
                    <button
                      onClick={() => store.setCanEvacuate(false)}
                      className={`flex-1 py-3 px-4 rounded-radius-card border text-sm font-medium transition-all ${
                        !store.assessment.canEvacuate
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border text-text-2 hover:border-border-strong"
                      }`}
                    >
                      No, I must shelter in place
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost" size="lg" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={handleNext}
                disabled={!store.assessment.location.country}
                className="font-semibold gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tell us about your group.</CardTitle>
                <CardDescription>Who's with you during this emergency?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* People steppers */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-text-2 mb-3">Adults</p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => store.setPeople(Math.max(0, store.assessment.adults - 1), store.assessment.children)}
                        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text hover:border-brand transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-display font-bold text-3xl text-text w-12 text-center">
                        {store.assessment.adults}
                      </span>
                      <button
                        onClick={() => store.setPeople(store.assessment.adults + 1, store.assessment.children)}
                        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text hover:border-brand transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-text-2 mb-3">Children (under 16)</p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => store.setPeople(store.assessment.adults, Math.max(0, store.assessment.children - 1))}
                        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text hover:border-brand transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-display font-bold text-3xl text-text w-12 text-center">
                        {store.assessment.children}
                      </span>
                      <button
                        onClick={() => store.setPeople(store.assessment.adults, store.assessment.children + 1)}
                        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text hover:border-brand transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Medical conditions */}
                <div>
                  <p className="text-sm text-text-2 mb-3">Medical conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalChipOptions.map((condition) => {
                      const isSelected = store.assessment.medicalConditions.includes(condition)
                      return (
                        <motion.button
                          key={condition}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (condition === "None") {
                              store.setMedicalConditions(["None"])
                            } else {
                              const others = store.assessment.medicalConditions.filter(
                                (c) => c !== "None"
                              )
                              store.setMedicalConditions(
                                isSelected
                                  ? others.filter((c) => c !== condition)
                                  : [...others, condition]
                              )
                            }
                          }}
                          className={`px-3 py-1.5 rounded-radius-pill text-xs font-medium border transition-all ${
                            isSelected
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-border text-text-2 hover:border-border-strong"
                          }`}
                        >
                          {condition}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-2 block mb-2">Medications required</label>
                  <textarea
                    value={store.assessment.medications}
                    onChange={(e) => store.setMedications(e.target.value)}
                    placeholder="List any critical medications, e.g. insulin, EpiPen..."
                    rows={2}
                    className="w-full bg-surface-2 border border-border rounded-radius-input px-4 py-3 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand resize-none"
                  />
                </div>

                {/* Pets */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-text-2">Pets</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => store.setPets([...store.assessment.pets, { count: 1, type: "dog" as const }])}
                    >
                      + Add pet
                    </Button>
                  </div>
                  {store.assessment.pets.length === 0 ? (
                    <p className="text-xs text-text-3 italic">No pets added.</p>
                  ) : (
                    <div className="space-y-2">
                      {store.assessment.pets.map((entry, i) => (
                        <div key={i} className="flex items-center gap-4 bg-surface-2 rounded-radius-card p-3 border border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-2">Count:</span>
                            <button
                              onClick={() => {
                                const next = [...store.assessment.pets]
                                next[i] = { ...next[i], count: Math.max(1, next[i].count - 1) }
                                store.setPets(next)
                              }}
                              className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-text hover:border-brand text-sm"
                            >−</button>
                            <span className="font-display font-semibold text-base text-text w-5 text-center">{entry.count}</span>
                            <button
                              onClick={() => {
                                const next = [...store.assessment.pets]
                                next[i] = { ...next[i], count: next[i].count + 1 }
                                store.setPets(next)
                              }}
                              className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-text hover:border-brand text-sm"
                            >+</button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(["dog", "cat", "other"] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => {
                                  const next = [...store.assessment.pets]
                                  next[i] = { ...next[i], type: t }
                                  store.setPets(next)
                                }}
                                className={`px-2.5 py-1 rounded-radius-pill text-xs font-medium border transition-all ${
                                  entry.type === t
                                    ? "border-brand bg-brand/10 text-brand"
                                    : "border-border text-text-2 hover:border-border-strong"
                                }`}
                              >
                                {t === "dog" ? "Dog" : t === "cat" ? "Cat" : "Other"}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => store.setPets(store.assessment.pets.filter((_, j) => j !== i))}
                            className="ml-auto text-xs text-text-3 hover:text-critical transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost" size="lg" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="default" size="lg" onClick={handleNext} className="font-semibold gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What do you have access to?</CardTitle>
                <CardDescription>Current situation details help agents tailor their recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Power status */}
                <div>
                  <p className="text-sm text-text-2 mb-3">Power status</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(["full", "generator", "none"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => store.setPowerStatus(status)}
                        className={`py-3 px-4 rounded-radius-card border text-sm font-medium transition-all ${
                          store.assessment.powerStatus === status
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border text-text-2 hover:border-border-strong"
                        }`}
                      >
                        {status === "full" && "Full power"}
                        {status === "generator" && "Generator / limited"}
                        {status === "none" && "No power"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Water status */}
                <div>
                  <p className="text-sm text-text-2 mb-3">Water access</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(["running", "stored", "none"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => store.setWaterStatus(status)}
                        className={`py-3 px-4 rounded-radius-card border text-sm font-medium transition-all ${
                          store.assessment.waterStatus === status
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border text-text-2 hover:border-border-strong"
                        }`}
                      >
                        {status === "running" && "Running water"}
                        {status === "stored" && "Stored water"}
                        {status === "none" && "No water access"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communications */}
                <div>
                  <p className="text-sm text-text-2 mb-3">Communication available</p>
                  <div className="flex flex-wrap gap-2">
                    {communicationOptions.map((opt) => {
                      const isSelected = store.assessment.communications.includes(opt)
                      return (
                        <motion.button
                          key={opt}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            store.setCommunications(
                              isSelected
                                ? store.assessment.communications.filter((c) => c !== opt)
                                : [...store.assessment.communications, opt]
                            )
                          }}
                          className={`px-3 py-1.5 rounded-radius-pill text-xs font-medium border transition-all ${
                            isSelected
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-border text-text-2 hover:border-border-strong"
                          }`}
                        >
                          {opt}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Supplies */}
                <div>
                  <p className="text-sm text-text-2 mb-3">Available supplies</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {supplyOptions.map((item) => {
                      const isSelected = store.assessment.supplies.includes(item)
                      return (
                        <motion.button
                          key={item}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (item === "None of the above") {
                              store.setSupplies(["None of the above"])
                            } else {
                              const others = store.assessment.supplies.filter(
                                (s) => s !== "None of the above"
                              )
                              store.setSupplies(
                                isSelected
                                  ? others.filter((s) => s !== item)
                                  : [...others, item]
                              )
                            }
                          }}
                          className={`py-2 px-3 rounded-radius-card border text-[11px] font-medium transition-all text-left ${
                            isSelected
                              ? "border-brand bg-brand/5 text-brand"
                              : "border-border text-text-2 hover:border-border-strong"
                          }`}
                        >
                          {item}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Time slider */}
                <div>
                  <p className="text-sm text-text-2 mb-3">Time since disaster started</p>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={timeSliderIndex}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value)
                      setTimeSliderIndex(idx)
                      store.setHoursElapsed(TIME_OPTIONS[idx])
                    }}
                    className="w-full h-1.5 appearance-none bg-surface-2 rounded-full outline-none cursor-pointer accent-brand mb-2
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-text-3">
                    <span>0 hr</span>
                    <span>1 hr</span>
                    <span>6 hr</span>
                    <span>24 hr</span>
                    <span>72 hr</span>
                  </div>
                  <p className="text-center text-sm text-brand font-mono mt-2">
                    ~{TIME_OPTIONS[timeSliderIndex]} hours
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost" size="lg" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="default" size="lg" onClick={handleNext} className="font-semibold gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ready to assemble your response team.</CardTitle>
                <CardDescription>Review your information below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReviewRow
                  label="SITUATION"
                  value={`${store.assessment.disasterType.join(", ")}${store.assessment.disasterDetails ? ` — ${store.assessment.disasterDetails}` : ""}`}
                  onEdit={() => setStep(1)}
                />
                <ReviewRow
                  label="LOCATION"
                  value={`${store.assessment.location.city}, ${store.assessment.location.state}, ${store.assessment.location.country} — ${store.assessment.canEvacuate ? "Can evacuate" : "Shelter in place"}`}
                  onEdit={() => setStep(2)}
                />
                <ReviewRow
                  label="GROUP"
                  value={`${store.assessment.adults} adults, ${store.assessment.children} children`}
                  onEdit={() => setStep(3)}
                />
                {store.assessment.pets.length > 0 && (
                  <ReviewRow
                    label="PETS"
                    value={store.assessment.pets.map((p) => `${p.count} ${p.type}${p.count > 1 ? "s" : ""}`).join(", ")}
                    onEdit={() => setStep(3)}
                  />
                )}
                {store.assessment.medicalConditions.length > 0 && (
                  <ReviewRow
                    label="MEDICAL"
                    value={store.assessment.medicalConditions.join(", ")}
                    onEdit={() => setStep(3)}
                  />
                )}
                <ReviewRow
                  label="SITUATION"
                  value={`${store.assessment.powerStatus === "none" ? "No power" : store.assessment.powerStatus === "generator" ? "Generator" : "Full power"}, ${store.assessment.waterStatus} water`}
                  onEdit={() => setStep(4)}
                />
                <ReviewRow
                  label="TIME"
                  value={`~${store.assessment.hoursElapsed} hours since onset`}
                  onEdit={() => setStep(4)}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button
                variant="default"
                size="xl"
                onClick={handleLaunch}
                disabled={loading}
                className="w-full font-display font-semibold text-base gap-3 h-14"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Assembling response team...
                  </>
                ) : (
                  <>
                    <RadarPing size={24} active blips={2} className="scale-50" />
                    Assemble Response Team
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-text-3">
                Your data is not stored permanently. Sessions expire after 24 hours.
              </p>
            </div>

            <div className="flex justify-start">
              <Button variant="ghost" size="lg" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
      <StepWizard currentStep={step} steps={steps}>
        {renderStep()}
      </StepWizard>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <span className="text-[11px] font-mono tracking-wider text-text-3">{label}</span>
        <p className="text-sm text-text mt-0.5">{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-text-3 hover:text-brand transition-colors shrink-0 mt-1"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
