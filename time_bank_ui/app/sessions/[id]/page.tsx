"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Star, CheckCircle2, XCircle, Video, Clock, Info, Send, CalendarClock } from "lucide-react"
import { apiRequest } from "@/lib/api"

type SessionDetailPayload = {
  session: {
    id: number;
    skill: { id: number; name: string };
    status: string;
    teacher: { id: number; name: string };
    learner: { id: number; name: string };
    duration_min: number;
    scheduled_at: string | null;
    meeting_link: string;
    teacher_confirmed_complete: boolean;
    learner_confirmed_complete: boolean;
    duration_elapsed: boolean;
  };
  is_teacher: boolean;
  credit_balance: number;
  already_reviewed: boolean;
  chat: Array<{
    id: number;
    sender_id: number;
    sender_name: string;
    message: string;
    created_at: string;
  }>;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "TB"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)

  const [data, setData] = useState<SessionDetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [meetingLink, setMeetingLink] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [durationMin, setDurationMin] = useState("60")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [hydratedForm, setHydratedForm] = useState(false)
  const [nowTick, setNowTick] = useState(Date.now())

  async function loadSession(silent = false) {
    try {
      if (!silent) setErrorMessage("")
      const payload = await apiRequest<SessionDetailPayload>(`sessions/${id}/`)
      setData(payload)
      if (!hydratedForm) {
        setMeetingLink(payload.session.meeting_link || "")
        setDurationMin(String(payload.session.duration_min || 60))
        if (payload.session.scheduled_at) {
          const dt = new Date(payload.session.scheduled_at)
          const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          setScheduledAt(local.toISOString().slice(0, 16))
        }
        setHydratedForm(true)
      }
    } catch (err) {
      if (!silent) {
        const message = err instanceof Error ? err.message : "Failed to load session."
        setErrorMessage(message)
        if (message.toLowerCase().includes("authentication")) {
          router.push("/login")
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    const interval = setInterval(() => {
      loadSession(true)
    }, 7000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hydratedForm])

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function runAction(path: string, body?: unknown, successMessage?: string) {
    try {
      setErrorMessage("")
      await apiRequest(path, { method: "POST", body })
      if (successMessage) setActionMessage(successMessage)
      await loadSession()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Action failed.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Session not found</h2>
            <Link href="/sessions" className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to sessions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const session = data.session
  const viewerId = data.is_teacher ? session.teacher.id : session.learner.id
  const bothConfirmed = session.teacher_confirmed_complete && session.learner_confirmed_complete
  const isJitsi = session.meeting_link.includes("meet.jit.si")
  const timing = session.scheduled_at
    ? (() => {
        const start = new Date(session.scheduled_at).getTime()
        const end = start + session.duration_min * 60_000
        const total = Math.max(end - start, 1)
        const elapsed = Math.min(Math.max(nowTick - start, 0), total)
        const remaining = end - nowTick
        return {
          started: nowTick >= start,
          ended: nowTick >= end,
          progress: Math.round((elapsed / total) * 100),
          remainingMs: remaining,
          startMs: start,
          endMs: end,
        }
      })()
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <Link href="/sessions" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Sessions
          </Link>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-xl">{session.skill.name}</CardTitle>
                <StatusBadge status={session.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {initialsFromName(session.teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Teacher</p>
                    <p className="text-sm font-semibold text-foreground">{session.teacher.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                      {initialsFromName(session.learner.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Learner</p>
                    <p className="text-sm font-semibold text-foreground">{session.learner.name}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-6 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : "Date not set"}
                </span>
                <span className="text-muted-foreground">Duration: {session.duration_min} min</span>
                <span className="text-muted-foreground">Your Credits: {data.credit_balance}</span>
              </div>
              {timing && (
                <div className="mt-4">
                  <Progress value={timing.progress} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {timing.started
                      ? timing.ended
                        ? "Scheduled duration completed."
                        : `Time remaining: ${Math.max(Math.ceil(timing.remainingMs / 60000), 0)} min`
                      : `Starts in ${Math.max(Math.ceil((timing.startMs - nowTick) / 60000), 0)} min`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {actionMessage && (
            <Alert className="mt-6 border-accent/30 bg-accent/5">
              <Info className="h-4 w-4 text-accent" />
              <AlertDescription className="text-foreground">{actionMessage}</AlertDescription>
            </Alert>
          )}
          {errorMessage && (
            <Alert className="mt-6 border-destructive/30 bg-destructive/5">
              <Info className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-foreground">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {data.is_teacher && session.status === "requested" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Accept, Schedule, and Generate Class Link</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Agree in chat, then set date/time and duration. If no link is provided, a Jitsi link is auto-generated.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="scheduledAt">Date & Time</Label>
                    <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="durationMin">Duration (minutes)</Label>
                    <Input id="durationMin" type="number" min={15} max={240} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="meetingLink">Meeting Link (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <Input id="meetingLink" placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() =>
                      runAction(
                        `sessions/${id}/accept/`,
                        {
                          meeting_link: meetingLink,
                          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
                          duration_min: Number(durationMin || 60),
                        },
                        "Session accepted and scheduled."
                      )
                    }
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Accept & Schedule
                  </Button>
                  <Button variant="outline" onClick={() => runAction(`sessions/${id}/decline/`, {}, "Session declined.")} className="border-destructive/30 text-destructive hover:bg-destructive/5">
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Pre-session Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto rounded-md border border-border p-3">
                {data.chat.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet. Start arranging your session details.</p>
                ) : (
                  <div className="space-y-2">
                    {data.chat.map((msg) => (
                      <div key={msg.id} className={`rounded-lg p-2 text-sm ${msg.sender_id === viewerId ? "bg-accent/10" : "bg-muted"}`}>
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{msg.sender_name}</span>
                          <span>{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Discuss goals, timing, materials..." />
                <Button
                  disabled={!chatInput.trim()}
                  onClick={async () => {
                    await runAction(`sessions/${id}/chat/send/`, { message: chatInput.trim() })
                    setChatInput("")
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {session.status === "accepted" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Classroom & Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : "Not scheduled"}
                  </span>
                  <span>Duration target: {session.duration_min} min</span>
                </div>

                {session.meeting_link ? (
                  <div className="mb-4">
                    {isJitsi ? (
                      <iframe
                        title="Classroom"
                        src={session.meeting_link}
                        className="h-[420px] w-full rounded-md border border-border"
                        allow="camera; microphone; fullscreen; display-capture"
                      />
                    ) : (
                      <a href={session.meeting_link} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                        Open class link
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">No meeting link available yet.</p>
                )}

                <p className="mb-3 text-sm text-muted-foreground">
                  Completion requires confirmation from both teacher and learner after duration is elapsed.
                </p>
                <div className="mb-3 flex flex-wrap gap-3 text-sm">
                  <span>Teacher confirmed: {session.teacher_confirmed_complete ? "Yes" : "No"}</span>
                  <span>Learner confirmed: {session.learner_confirmed_complete ? "Yes" : "No"}</span>
                </div>
                <Button
                  disabled={!session.duration_elapsed || bothConfirmed}
                  onClick={() => runAction(`sessions/${id}/confirm-complete/`, {}, "Completion confirmation submitted.")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {bothConfirmed ? "Completed by both parties" : session.duration_elapsed ? "Confirm Completion" : "Wait for duration to elapse"}
                </Button>
              </CardContent>
            </Card>
          )}

          {session.status === "completed" && !data.already_reviewed && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110" aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}>
                        <Star className={`h-7 w-7 ${star <= rating ? "fill-accent text-accent" : "text-border"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea id="comment" placeholder="How was your experience?" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
                <Button disabled={!rating} onClick={() => runAction(`sessions/${id}/review/`, { rating, comment }, "Thanks for the review.")}>
                  Submit Review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
