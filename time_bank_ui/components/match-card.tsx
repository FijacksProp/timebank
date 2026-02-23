"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, ArrowRight, Clock3, Trophy, Star, Coins } from "lucide-react"

interface MatchCardProps {
  profileId: number
  name: string
  initials: string
  score: number
  bio: string
  reasons: string[]
  level: string
  timezone: string
  languages: string
  matchBlurb: string
  matchDetails: {
    shared_skill: string
    score_percent: number
    timezone_note: string
  }
  profileStats: {
    hours_traded: number
    completed_sessions: number
    reputation_score: number
    rating_avg: number
    credit_balance: number
  }
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
  level,
  timezone,
  languages,
  matchBlurb,
  matchDetails,
  profileStats,
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
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-left text-base font-bold text-foreground hover:text-accent hover:underline">
                    {name}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{name}</DialogTitle>
                    <DialogDescription>
                      {bio}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Level</p>
                      <p className="font-semibold text-foreground">{level}</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Timezone</p>
                      <p className="font-semibold text-foreground">{timezone}</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-sm sm:col-span-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Languages</p>
                      <p className="font-semibold text-foreground">{languages || "Not set"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" /> Hours Traded
                      </p>
                      <p className="font-semibold text-foreground">{profileStats.hours_traded}h</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <Trophy className="h-3.5 w-3.5" /> Reputation
                      </p>
                      <p className="font-semibold text-foreground">{profileStats.reputation_score}/100</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <Star className="h-3.5 w-3.5" /> Rating
                      </p>
                      <p className="font-semibold text-foreground">{profileStats.rating_avg.toFixed(1)} / 5</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-sm">
                      <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
                        <Coins className="h-3.5 w-3.5" /> Credit Balance
                      </p>
                      <p className="font-semibold text-foreground">{profileStats.credit_balance}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Can Teach</p>
                    <div className="flex flex-wrap gap-1.5">
                      {offeredSkills.map((skill) => (
                        <span key={skill.id} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wants To Learn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {wantedSkills.map((skill) => (
                        <span key={skill.id} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
          <p className="mb-2 text-sm text-foreground">{matchBlurb}</p>
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
          <p className="mt-2 text-xs text-muted-foreground">
            Shared interest: {matchDetails.shared_skill} | {matchDetails.score_percent}% match | {matchDetails.timezone_note}
          </p>
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
