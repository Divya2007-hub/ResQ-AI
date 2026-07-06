"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepConfig {
  label: string
  shortLabel: string
}

interface StepWizardProps {
  currentStep: number
  steps: StepConfig[]
  children: React.ReactNode
}

export function StepWizard({ currentStep, steps, children }: StepWizardProps) {
  return (
    <div className="w-full max-w-[680px] mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-10 px-1">
        {steps.map((step, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isFuture = stepNum > currentStep

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 border-2",
                    isCompleted && "bg-brand border-brand text-[#080d16]",
                    isCurrent && "border-brand text-text bg-transparent",
                    isFuture && "border-text-3 text-text-3 bg-transparent"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono uppercase tracking-wider hidden sm:block",
                    isCompleted && "text-brand",
                    isCurrent && "text-text",
                    isFuture && "text-text-3"
                  )}
                >
                  {step.shortLabel}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[1px] mx-3 mt-[-1.5rem] transition-all duration-400",
                    isCompleted ? "bg-brand" : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
