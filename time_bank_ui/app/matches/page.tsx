"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MatchCard } from "@/components/match-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal, Users } from "lucide-react"
import { apiRequest } from "@/lib/api"

type MatchItem = {
  profile_id: number;
  name: string;
  bio: string;
  score: number;
  reasons: string[];
  reciprocal_skills: Array<{ id: number; name: string }>;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "TB"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function MatchesPage() {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("score")
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const payload = await apiRequest<{ matches: MatchItem[] }>("matches/")
        if (mounted) setMatches(payload.matches)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load matches.")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handleRequest(profileId: number, skillId: number) {
    setNotice("")
    setError("")
    try {
      await apiRequest(`matches/request/${profileId}/`, {
        method: "POST",
        body: { skill_id: skillId },
      })
      setNotice("Session request sent successfully.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.")
    }
  }

  const filtered = useMemo(() => {
    return matches
      .filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.bio.toLowerCase().includes(query.toLowerCase()) ||
          m.reciprocal_skills.some((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      )
      .sort((a, b) => (sortBy === "score" ? b.score - a.score : a.name.localeCompare(b.name)))
  }, [matches, query, sortBy])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Matches</h1>
            <p className="mt-1 text-muted-foreground">
              People whose skills complement yours. The higher the score, the better the fit.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, skill, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Best Match</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && <p className="mb-4 text-sm text-muted-foreground">Loading matches...</p>}
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {notice && <p className="mb-4 text-sm text-chart-2">{notice}</p>}

          {filtered.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => (
                <MatchCard
                  key={m.profile_id}
                  profileId={m.profile_id}
                  name={m.name}
                  initials={initialsFromName(m.name)}
                  score={m.score}
                  bio={m.bio}
                  reasons={m.reasons}
                  skills={m.reciprocal_skills}
                  onRequest={handleRequest}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">No matches found</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try broadening your search or adding more skills to your profile to unlock new matches.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

