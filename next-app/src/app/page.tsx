"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  MessageSquare, Zap, ClipboardList, ArrowRight, Play,
  ShieldAlert, HeartPulse, Radio, Package, TrendingUp,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadarPing } from "@/components/radar/RadarPing"

const stagger = {
  animate: {
    transition: { staggerChildren: 0.15 },
  },
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Describe Your Situation",
    desc: "Tell us the disaster type, your location, who's with you, medical conditions, and what you have access to.",
  },
  {
    number: "02",
    icon: Zap,
    title: "Agents Assemble",
    desc: "Five specialized AI agents activate simultaneously — each one an expert in a different aspect of emergency response.",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Your Action Plan",
    desc: "Receive a prioritized, personalized plan. Download it, share it, or act on it immediately — no internet needed once downloaded.",
  },
]

const agents = [
  {
    name: "Safety Coordinator",
    icon: ShieldAlert,
    color: "text-critical",
    border: "border-l-critical",
    desc: "Assesses immediate threats and generates step-by-step safety actions for the first critical hour.",
  },
  {
    name: "Medical Advisor",
    icon: HeartPulse,
    color: "text-warning",
    border: "border-l-warning",
    desc: "Addresses medical conditions, medications, and first aid protocols for your specific health situation.",
  },
  {
    name: "Communications Lead",
    icon: Radio,
    color: "text-brand",
    border: "border-l-brand",
    desc: "Creates family contact messages, emergency broadcast templates, and connectivity alternatives.",
  },
  {
    name: "Resource Coordinator",
    icon: Package,
    color: "text-info",
    border: "border-l-info",
    desc: "Inventories your supplies, identifies gaps, and generates a prioritized emergency kit checklist.",
  },
  {
    name: "Recovery Planner",
    icon: TrendingUp,
    color: "text-stable",
    border: "border-l-stable",
    desc: "Plans the hours and days after immediate danger — insurance steps, shelter, documentation.",
  },
]

const trustChips = [
  "REAL-TIME STREAMING",
  "5 SPECIALIZED AGENTS",
  "PERSONALIZED TO YOUR SITUATION",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 md:px-12">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/5 blur-[100px]" />

        <div className="max-w-[1200px] mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-20">
          {/* Radar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="shrink-0"
          >
            <RadarPing size={400} active blips={4} />
          </motion.div>

          {/* Hero text */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="max-w-[580px]"
          >
            <motion.p
              variants={fadeUp}
              className="font-mono text-[12px] text-brand uppercase tracking-[0.2em] mb-4"
            >
              MULTI-AGENT EMERGENCY RESPONSE
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-display font-bold text-[42px] md:text-[64px] leading-[1.1] text-text mb-6"
            >
              Your Personal
              <br />
              Emergency
              <br />
              Response Team
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-text-2 leading-relaxed mb-8"
            >
              Describe your situation. Five AI agents assemble instantly — covering safety, medical, communication, resources, and recovery — in real time.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-8">
              <Link href="/assess">
                <Button variant="default" size="xl" className="font-semibold gap-2">
                  Describe My Emergency
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="gap-2" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                <Play className="w-5 h-5" />
                See How It Works
              </Button>
            </motion.div>

            {/* Trust chips */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              {trustChips.map((chip) => (
                <div
                  key={chip}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-radius-pill bg-surface border border-border"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
                  <span className="text-[11px] font-mono tracking-wider text-text-2">{chip}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-3 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center font-display font-semibold text-3xl text-text mb-4"
          >
            From crisis to clarity in under 60 seconds.
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          >
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  className="relative bg-surface border border-border rounded-radius-card p-8 overflow-hidden"
                >
                  <span className="absolute -top-4 -right-2 font-display font-bold text-[80px] text-text-3/10 select-none">
                    {step.number}
                  </span>
                  <Icon className="w-7 h-7 text-brand mb-4" />
                  <h3 className="font-display font-semibold text-lg text-text mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-2 leading-relaxed">{step.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* The 5 Agents */}
      <section className="py-24 px-6 md:px-12 bg-surface/50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-semibold text-3xl text-text mb-3">
              Meet your response team.
            </h2>
            <p className="text-text-2">Assembled automatically, specialized by design.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {agents.map((agent) => {
              const Icon = agent.icon
              return (
                <motion.div
                  key={agent.name}
                  whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
                  className={`border-l-2 ${agent.border} bg-surface border border-border rounded-radius-card p-5 transition-all duration-200`}
                >
                  <Icon className={`w-8 h-8 ${agent.color} mb-3`} />
                  <h3 className="font-display font-semibold text-sm text-text mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-text-2 leading-relaxed mb-4">{agent.desc}</p>
                  <Badge variant="stable" className="text-[10px]">
                    STATUS: READY
                  </Badge>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent" />
            <CardContent className="p-12 md:p-20 flex flex-col items-center text-center relative">
              <RadarPing size={120} active blips={3} />
              <h2 className="font-display font-semibold text-2xl text-text mt-6 mb-3">
                See ResQ AI in action
              </h2>
              <p className="text-text-2 max-w-md mb-8">
                Watch five AI agents activate simultaneously and stream their analysis in real time — exactly like watching a team of specialists respond to an emergency.
              </p>
              <Link href="/assess">
                <Button variant="default" size="lg" className="font-semibold gap-2">
                  Try it live
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <Card className="border-t-2 border-t-brand overflow-hidden">
            <CardContent className="p-12 md:p-20 flex flex-col items-center text-center">
              <p className="text-lg text-text-2 mb-6 max-w-lg italic">
                &ldquo;When every minute matters, you need answers — not Google searches.&rdquo;
              </p>
              <Link href="/assess">
                <Button variant="default" size="xl" className="font-semibold gap-2">
                  Start Emergency Assessment
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
