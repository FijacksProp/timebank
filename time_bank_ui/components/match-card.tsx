"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, ArrowRight } from "lucide-react"

interface MatchCardProps {
  profileId: number
  name: string
  initials: string
  score: number
  bio: string
  reasons: string[]
  offeredSkills: Array<{ id: number; name: string }>
  wantedSkills: Array<{ id: number; name: string }>
  reciprocalSkills: Array<{ id: number; name: string }>
  onRequest: (profileId: number, skillId: number) => Promise<void>
}

export function MatchCard({
  profileId,
  name,
  initials,
  score,
  bio,
  reasons,
  offeredSkills,
  wantedSkills,
  reciprocalSkills,
  onRequest,
}: MatchCardProps) {
  const [selectedSkill, setSelectedSkill] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleRequest() {
    if (!selectedSkill) return
    try {
      setSubmitting(true)
      await onRequest(profileId, Number(selectedSkill))
      setSelectedSkill("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="group transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-base font-bold text-foreground">{name}</h3>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {bio}
              </p>
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <span className="text-sm font-bold text-accent">{score}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Why you match
          </p>
          <ul className="flex flex-col gap-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {r}
              </li>
            ))}
          </ul>
          {reciprocalSkills.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Mutual fit: {reciprocalSkills.map((s) => s.name).join(", ")}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Can Teach</p>
            <div className="flex flex-wrap gap-1.5">
              {offeredSkills.slice(0, 5).map((skill) => (
                <span key={skill.id} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wants To Learn</p>
            <div className="flex flex-wrap gap-1.5">
              {wantedSkills.slice(0, 5).map((skill) => (
                <span key={skill.id} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a skill to request" />
            </SelectTrigger>
            <SelectContent>
              {offeredSkills.map((skill) => (
                <SelectItem key={skill.id} value={String(skill.id)}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selectedSkill || submitting} className="shrink-0" onClick={handleRequest}>
            Request
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
