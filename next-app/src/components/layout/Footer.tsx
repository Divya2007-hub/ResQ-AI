"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink } from "lucide-react"

export function Footer() {
  const pathname = usePathname()
  const showFooter = pathname === "/" || pathname === "/resources"

  if (!showFooter) return null

  return (
    <footer className="border-t border-border py-6">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-brand/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          </div>
          <span className="font-display font-semibold text-sm text-text">ResQ AI</span>
        </div>
        <p className="text-xs text-text-3 hidden sm:block">
          Built for the Global AI Hackathon Series — Agents for Good track
        </p>
        <Link
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-2 hover:text-text transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
        </Link>
      </div>
    </footer>
  )
}
