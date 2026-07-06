"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isResponsePage = pathname.includes("/response")

  if (isResponsePage) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-bg/80 backdrop-blur-md flex items-center px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-brand/50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
          </div>
          <span className="font-display font-semibold text-sm tracking-wide text-text">
            ResQ
          </span>
          <span className="text-xs font-display font-bold text-brand">AI</span>
        </Link>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border border-brand/50 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse-dot" />
          </div>
          <span className="font-display font-semibold text-base tracking-wide text-text">
            ResQ
          </span>
          <span className="text-xs font-display font-bold text-brand">AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/history"
            className="text-sm text-text-2 hover:text-text transition-colors font-medium"
          >
            Emergency History
          </Link>
          <Badge variant="stable" className="gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-stable animate-pulse-dot" />
            All Systems Operational
          </Badge>
          <Link href="/assess">
            <Button variant="default" size="sm" className="font-semibold">
              Start Assessment
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-text-2 hover:text-text"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-6 py-4 space-y-3">
            <Link
              href="/history"
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-text-2 hover:text-text"
            >
              Emergency History
            </Link>
            <Link href="/assess" onClick={() => setMobileOpen(false)}>
              <Button variant="default" size="default" className="w-full font-semibold">
                Start Assessment
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
