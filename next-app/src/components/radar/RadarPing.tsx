"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface RadarPingProps {
  size?: number
  active?: boolean
  blips?: number
  className?: string
}

export function RadarPing({ size = 200, active = true, blips = 4, className }: RadarPingProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const blipPositions = Array.from({ length: blips }, (_, i) => ({
    angle: (i * 360) / blips,
    distance: 50,
  }))

  const showBlips = active && mounted

  const center = size / 2
  const outerRadius = (size / 2) - 4

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle at center, rgba(6,182,212,0.15) 0%, transparent 70%)`,
          width: size,
          height: size,
        }}
      />

      {/* Outer ring */}
      <svg className="absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="rgba(6,182,212,0.2)"
          strokeWidth="1"
        />
        {/* Inner dashed rings */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius * 0.7}
          fill="none"
          stroke="rgba(6,182,212,0.12)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius * 0.4}
          fill="none"
          stroke="rgba(6,182,212,0.08)"
          strokeWidth="0.5"
          strokeDasharray="2 4"
        />
      </svg>

      {/* Sweep arm */}
      {active && mounted && (
        <div
          className="absolute animate-radar-sweep"
          style={{ width: size, height: size }}
        >
          <div
            className="absolute"
            style={{
              top: center,
              left: center,
              width: outerRadius,
              height: 2,
              background: `linear-gradient(90deg, rgba(6,182,212,0.6) 0%, rgba(6,182,212,0) 100%)`,
              transformOrigin: "0 50%",
              transform: "rotate(0deg)",
            }}
          />
        </div>
      )}

      {/* Blip dots */}
      {showBlips && blipPositions.map((blip, i) => (
        <div
          key={i}
          className="absolute animate-radar-blip"
          suppressHydrationWarning
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#06b6d4",
            boxShadow: "0 0 8px rgba(6,182,212,0.8)",
            left: center + Math.cos((blip.angle * Math.PI) / 180) * (outerRadius * (blip.distance / 100)) - 3,
            top: center + Math.sin((blip.angle * Math.PI) / 180) * (outerRadius * (blip.distance / 100)) - 3,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        <div className="text-brand font-display font-bold text-sm tracking-wider">
          ResQ
        </div>
        <div className="text-[10px] font-mono text-brand/60 tracking-[0.2em] uppercase">
          AI
        </div>
      </div>
    </div>
  )
}
