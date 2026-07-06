"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Search, Download, Eye, FileText,
  ShoppingBag, Car, Heart, Zap, Droplets, Flame,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const checklists = [
  {
    icon: ShoppingBag,
    title: "72-Hour Emergency Kit",
    desc: "Complete checklist for a standard emergency survival kit.",
  },
  {
    icon: Car,
    title: "Evacuation Checklist",
    desc: "What to pack and prepare when you need to evacuate quickly.",
  },
  {
    icon: Heart,
    title: "Pet Emergency Plan",
    desc: "Emergency supplies and plans for your animal companions.",
  },
  {
    icon: Heart,
    title: "Medical Emergency Prep",
    desc: "Medical supply checklist and health emergency protocols.",
  },
  {
    icon: Zap,
    title: "Power Outage Survival Guide",
    desc: "How to stay safe and comfortable during extended power outages.",
  },
  {
    icon: Droplets,
    title: "Flood Preparation",
    desc: "Before, during, and after flood safety guidelines.",
  },
]

const contacts = [
  { agency: "FEMA", type: "Disaster", phone: "1-800-621-3362", website: "fema.gov", available24: true },
  { agency: "American Red Cross", type: "Disaster", phone: "1-800-733-2767", website: "redcross.org", available24: true },
  { agency: "National Poison Control", type: "Medical", phone: "1-800-222-1222", website: "poison.org", available24: true },
  { agency: "CDC Emergency", type: "Medical", phone: "1-800-232-4636", website: "cdc.gov", available24: true },
  { agency: "National Suicide Prevention", type: "Mental Health", phone: "988", website: "988lifeline.org", available24: true },
  { agency: "United Way Helpline", type: "Resource", phone: "211", website: "211.org", available24: true },
]

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredContacts = contacts.filter(
    (c) =>
      c.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <Badge variant="default" className="mb-3 text-[10px] tracking-wider">RESOURCE LIBRARY</Badge>
          <h1 className="font-display font-bold text-3xl text-text mb-3">
            Emergency Resources
          </h1>
          <p className="text-text-2 max-w-xl">
            Emergency contacts, downloadable checklists, and educational guides for disaster preparedness.
          </p>
        </div>

        {/* Emergency Contacts */}
        <section className="mb-16">
          <h2 className="font-display font-semibold text-xl text-text mb-4">
            Emergency Contacts by Country / Region
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agencies or types..."
              className="w-full bg-surface-2 border border-border rounded-radius-input pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-brand"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-mono text-text-3 tracking-wider uppercase">Agency</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-text-3 tracking-wider uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-text-3 tracking-wider uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-text-3 tracking-wider uppercase hidden md:table-cell">Website</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-text-3 tracking-wider uppercase hidden md:table-cell">24/7</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.agency} className="border-b border-border hover:bg-surface-2/50 transition-colors">
                    <td className="py-3 px-4 text-text font-medium">{contact.agency}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {contact.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-text-2">{contact.phone}</td>
                    <td className="py-3 px-4 text-text-2 hidden md:table-cell">{contact.website}</td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {contact.available24 ? (
                        <Badge variant="stable" className="text-[10px]">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">No</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Separator className="mb-16" />

        {/* Downloadable Checklists */}
        <section className="mb-16">
          <h2 className="font-display font-semibold text-xl text-text mb-4">
            Downloadable Checklists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((checklist) => {
              const Icon = checklist.icon
              return (
                <Card key={checklist.title} className="hover:border-brand/30 transition-colors">
                  <CardContent className="p-5">
                    <Icon className="w-8 h-8 text-brand mb-3" />
                    <h3 className="font-display font-semibold text-sm text-text mb-1">{checklist.title}</h3>
                    <p className="text-xs text-text-2 mb-4">{checklist.desc}</p>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="text-xs gap-1.5">
                        <Download className="w-3 h-3" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5">
                        <Eye className="w-3 h-3" /> Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator className="mb-16" />

        {/* Disaster Guides */}
        <section>
          <h2 className="font-display font-semibold text-xl text-text mb-4">
            Disaster Type Guides
          </h2>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    icon: Droplets,
                    label: "Flooding",
                    before: "Know your flood zone. Elevate utilities. Prepare sandbags.",
                    during: "Move to higher ground. Avoid floodwaters. Turn off electricity if safe.",
                    after: "Don't return until declared safe. Document damage. Avoid contaminated water.",
                  },
                  {
                    icon: Flame,
                    label: "Wildfire",
                    before: "Create defensible space. Have go-bag ready. Know evacuation routes.",
                    during: "Evacuate immediately if told. Close windows/doors. Wear protective clothing.",
                    after: "Check for hot spots. Wear N95 mask. Document property damage.",
                  },
                  {
                    icon: Zap,
                    label: "Power Outage",
                    before: "Stock flashlights and batteries. Charge devices. Have backup power plan.",
                    during: "Keep fridge closed. Use generators outdoors. Unplug sensitive electronics.",
                    after: "Check food safety. Restock supplies. Report outage to utility.",
                  },
                  {
                    icon: Heart,
                    label: "Medical Emergency",
                    before: "Keep first aid kit updated. Know emergency contacts. Have medication list.",
                    during: "Call 911 immediately. Provide clear location. Follow dispatcher instructions.",
                    after: "Follow up with primary care. Restock emergency supplies. Update emergency plan.",
                  },
                ].map((guide) => {
                  const Icon = guide.icon
                  return (
                    <AccordionItem key={guide.label} value={guide.label}>
                      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-surface-2/50">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-brand" />
                          <span className="font-display font-semibold text-sm text-text">{guide.label}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-surface-2 rounded-radius-card p-4">
                            <Badge variant="info" className="mb-2 text-[10px]">BEFORE</Badge>
                            <p className="text-sm text-text-2">{guide.before}</p>
                          </div>
                          <div className="bg-surface-2 rounded-radius-card p-4">
                            <Badge variant="warning" className="mb-2 text-[10px]">DURING</Badge>
                            <p className="text-sm text-text-2">{guide.during}</p>
                          </div>
                          <div className="bg-surface-2 rounded-radius-card p-4">
                            <Badge variant="stable" className="mb-2 text-[10px]">AFTER</Badge>
                            <p className="text-sm text-text-2">{guide.after}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
