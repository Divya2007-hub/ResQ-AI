"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { ChecklistItem } from "@/lib/types"

interface ResourceChecklistProps {
  items: ChecklistItem[]
  category: "critical" | "missing" | "have"
}

const categoryConfig = {
  critical: { label: "CRITICAL (secure immediately)", color: "border-l-critical", bg: "bg-critical/5" },
  missing: { label: "MISSING FROM YOUR SUPPLIES (acquire ASAP)", color: "border-l-warning", bg: "bg-warning/5" },
  have: { label: "ALREADY IN YOUR SUPPLIES", color: "border-l-stable", bg: "bg-stable/5" },
}

export function ResourceChecklist({ items, category }: ResourceChecklistProps) {
  const [checked, setChecked] = useState<string[]>([])
  const cfg = categoryConfig[category]

  const toggle = (label: string) => {
    setChecked((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  return (
    <div className={cn("border-l-2 rounded-r-radius-card p-4 space-y-2", cfg.color, cfg.bg)}>
      <p className="text-xs font-semibold tracking-wider text-text-2 mb-3">{cfg.label}</p>
      {items.map((item) => {
        const isChecked = checked.includes(item.label)
        return (
          <motion.button
            key={item.label}
            onClick={() => toggle(item.label)}
            className={cn(
              "flex items-center gap-3 w-full text-left py-1.5 px-2 rounded-md transition-colors",
              "hover:bg-surface-2"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                isChecked
                  ? "bg-stable border-stable"
                  : "border-border-strong"
              )}
            >
              {isChecked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Check className="w-3 h-3 text-[#080d16]" />
                </motion.div>
              )}
            </div>
            <span
              className={cn(
                "text-sm transition-all duration-300",
                isChecked && "line-through text-text-3"
              )}
            >
              {item.label}
            </span>
            {category === "have" && !isChecked && (
              <Badge variant="stable" className="ml-auto text-[10px]">✓</Badge>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
