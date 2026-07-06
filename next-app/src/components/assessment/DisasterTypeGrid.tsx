"use client"

import { motion } from "framer-motion"
import {
  Droplets, Mountain, Flame, Wind, Tornado, Zap, Snowflake, Waves,
  FlaskConical, Building2, Heart, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface DisasterOption {
  id: string
  label: string
  icon: typeof Droplets
  color: string
}

const disasterTypes: DisasterOption[] = [
  { id: "flooding", label: "Flooding", icon: Droplets, color: "text-info" },
  { id: "earthquake", label: "Earthquake", icon: Mountain, color: "text-warning" },
  { id: "wildfire", label: "Wildfire", icon: Flame, color: "text-critical" },
  { id: "hurricane", label: "Hurricane", icon: Wind, color: "text-brand" },
  { id: "tornado", label: "Tornado", icon: Tornado, color: "text-warning" },
  { id: "power-outage", label: "Power Outage", icon: Zap, color: "text-warning" },
  { id: "winter-storm", label: "Winter Storm", icon: Snowflake, color: "text-info" },
  { id: "tsunami", label: "Tsunami", icon: Waves, color: "text-info" },
  { id: "chemical-spill", label: "Chemical Spill", icon: FlaskConical, color: "text-warning" },
  { id: "structural", label: "Structural", icon: Building2, color: "text-warning" },
  { id: "medical", label: "Medical", icon: Heart, color: "text-critical" },
  { id: "civil-unrest", label: "Civil Unrest", icon: Users, color: "text-warning" },
]

interface DisasterTypeGridProps {
  selected: string[]
  onSelect: (id: string[]) => void
}

export function DisasterTypeGrid({ selected, onSelect }: DisasterTypeGridProps) {
  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      onSelect([])
    } else {
      onSelect([id])
    }
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {disasterTypes.map((disaster) => {
        const isSelected = selected.includes(disaster.id)
        const Icon = disaster.icon

        return (
          <motion.button
            key={disaster.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(disaster.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-radius-card border bg-surface transition-all duration-200",
              isSelected
                ? "border-brand bg-brand/5 shadow-lg shadow-brand/10"
                : "border-border hover:border-border-strong hover:bg-surface-2"
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-[#080d16]" />
              </div>
            )}
            <Icon className={cn("w-7 h-7", disaster.color)} />
            <span className="text-xs font-medium text-text text-center leading-tight">
              {disaster.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
