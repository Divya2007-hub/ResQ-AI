"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, ArrowRight, History, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RadarPing } from "@/components/radar/RadarPing"
import { formatTime } from "@/lib/utils"

// Mock history data for demonstration
const mockSessions = [
  {
    id: "A7F3K2",
    disasterType: "Flooding",
    location: "Houston, TX",
    date: new Date("2026-07-05T14:30:00"),
    priority: "critical" as const,
  },
  {
    id: "B9X1M4",
    disasterType: "Power Outage",
    location: "Austin, TX",
    date: new Date("2026-07-04T09:15:00"),
    priority: "elevated" as const,
  },
  {
    id: "C2R5N8",
    disasterType: "Wildfire",
    location: "Los Angeles, CA",
    date: new Date("2026-07-03T18:45:00"),
    priority: "critical" as const,
  },
  {
    id: "D6V8P1",
    disasterType: "Winter Storm",
    location: "Denver, CO",
    date: new Date("2026-07-01T06:00:00"),
    priority: "stable" as const,
  },
]

const badgeVariant = {
  critical: "critical" as const,
  elevated: "warning" as const,
  stable: "stable" as const,
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = mockSessions.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.disasterType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (mockSessions.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 md:px-12 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-12 flex flex-col items-center">
            <RadarPing size={80} active={false} blips={2} />
            <h2 className="font-display font-semibold text-xl text-text mt-6 mb-2">
              No emergency sessions yet.
            </h2>
            <p className="text-sm text-text-2 mb-6">
              Plans are stored for 24 hours.
            </p>
            <Link href="/assess">
              <Button variant="default" size="default" className="gap-2">
                Run your first assessment
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <Badge variant="default" className="mb-3 text-[10px] tracking-wider">SESSION HISTORY</Badge>
          <h1 className="font-display font-bold text-3xl text-text mb-3">
            Emergency History
          </h1>
          <p className="text-text-2">View past emergency assessments and their generated plans.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by session ID, disaster type, or location..."
            className="w-full bg-surface-2 border border-border rounded-radius-input pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand"
          />
        </div>

        {/* Sessions list */}
        <div className="space-y-3">
          {filtered.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-radius-card p-4 hover:border-border-strong transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0">
                    <Badge variant={badgeVariant[session.priority]} className="text-[10px]">
                      {session.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-brand">{session.id}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {session.disasterType}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-2 mt-0.5">{session.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-3">
                    <Clock className="w-3 h-3" />
                    {session.date.toLocaleDateString()}
                  </div>
                  <Link href={`/response/${session.id}/plan`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      View Plan
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-text-2">No sessions match your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
