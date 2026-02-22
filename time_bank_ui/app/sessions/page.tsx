"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Calendar, BookOpen, GraduationCap } from "lucide-react"
import { apiRequest } from "@/lib/api"

type ApiSession = {
  id: number;
  skill: { id: number; name: string };
  partner: { id: number; name: string };
  status: string;
  scheduled_at: string | null;
  duration_min: number;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "TB"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function SessionRow({ session }: { session: ApiSession }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
          {initialsFromName(session.partner.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{session.skill.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{session.partner.name}</span>
          <span>|</span>
          <Calendar className="h-3 w-3" />
          <span>{session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : "Date not set"}</span>
          <span>|</span>
          <span>{session.duration_min} min</span>
        </div>
      </div>
      <StatusBadge status={session.status} />
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function SessionList({ sessions }: { sessions: ApiSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} />
      ))}
    </div>
  )
}

export default function SessionsPage() {
  const router = useRouter()
  const [learnerSessions, setLearnerSessions] = useState<ApiSession[]>([])
  const [teacherSessions, setTeacherSessions] = useState<ApiSession[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const payload = await apiRequest<{ as_learner: ApiSession[]; as_teacher: ApiSession[] }>("sessions/")
        if (!mounted) return
        setLearnerSessions(payload.as_learner)
        setTeacherSessions(payload.as_teacher)
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load sessions."
        setError(message)
        if (message.toLowerCase().includes("authentication")) {
          router.push("/login")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [router])

  const defaultTab = useMemo(() => (learnerSessions.length >= teacherSessions.length ? "learner" : "teacher"), [learnerSessions.length, teacherSessions.length])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Sessions</h1>
            <p className="mt-1 text-muted-foreground">Track all your learning and teaching sessions in one place.</p>
          </div>

          {loading && <p className="mb-4 text-sm text-muted-foreground">Loading sessions...</p>}
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {!loading && (
            <Tabs defaultValue={defaultTab}>
              <TabsList className="mb-6 flex h-auto w-full flex-wrap sm:w-auto">
                <TabsTrigger value="learner" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  As Learner
                </TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  As Teacher
                </TabsTrigger>
              </TabsList>
              <TabsContent value="learner">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sessions as Learner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SessionList sessions={learnerSessions} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="teacher">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sessions as Teacher</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SessionList sessions={teacherSessions} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
