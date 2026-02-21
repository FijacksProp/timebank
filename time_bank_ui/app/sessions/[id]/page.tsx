"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
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
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  XCircle,
  Video,
  Coins,
  Clock,
  Info,
} from "lucide-react"

// Mock session data
const sessionsMap: Record<
  string,
  {
    skill: string
    status: string
    teacher: { name: string; initials: string }
    learner: { name: string; initials: string }
    credits: number
    date: string
    isTeacher: boolean
  }
> = {
  "1": {
    skill: "React Advanced Patterns",
    status: "accepted",
    teacher: { name: "Marcus L.", initials: "ML" },
    learner: { name: "Jane Doe", initials: "JD" },
    credits: 2,
    date: "Mar 12, 2026 - 3:00 PM EST",
    isTeacher: false,
  },
  "2": {
    skill: "Data Visualization",
    status: "requested",
    teacher: { name: "Yuki T.", initials: "YT" },
    learner: { name: "Jane Doe", initials: "JD" },
    credits: 1,
    date: "Mar 14, 2026 - 10:00 AM EST",
    isTeacher: false,
  },
  "3": {
    skill: "UX Research Methods",
    status: "accepted",
    teacher: { name: "Jane Doe", initials: "JD" },
    learner: { name: "Ana R.", initials: "AR" },
    credits: 2,
    date: "Mar 13, 2026 - 2:00 PM EST",
    isTeacher: true,
  },
  "4": {
    skill: "Design Systems",
    status: "completed",
    teacher: { name: "Jane Doe", initials: "JD" },
    learner: { name: "Alex K.", initials: "AK" },
    credits: 2,
    date: "Mar 10, 2026 - 4:00 PM EST",
    isTeacher: true,
  },
  "5": {
    skill: "Python Basics",
    status: "completed",
    teacher: { name: "Raj P.", initials: "RP" },
    learner: { name: "Jane Doe", initials: "JD" },
    credits: 2,
    date: "Feb 28, 2026 - 11:00 AM EST",
    isTeacher: false,
  },
}

export default function SessionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const session = sessionsMap[id]
  const [meetingLink, setMeetingLink] = useState("")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [actionMessage, setActionMessage] = useState("")

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Session not found</h2>
            <Link
              href="/sessions"
              className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sessions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/sessions"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sessions
          </Link>

          {/* Session summary card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-xl">{session.skill}</CardTitle>
                <StatusBadge status={session.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {session.teacher.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Teacher</p>
                    <p className="text-sm font-semibold text-foreground">
                      {session.teacher.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                      {session.learner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Learner</p>
                    <p className="text-sm font-semibold text-foreground">
                      {session.learner.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-6 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> {session.date}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="h-4 w-4" /> {session.credits} credits
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action message */}
          {actionMessage && (
            <Alert className="mt-6 border-accent/30 bg-accent/5">
              <Info className="h-4 w-4 text-accent" />
              <AlertDescription className="text-foreground">{actionMessage}</AlertDescription>
            </Alert>
          )}

          {/* Teacher actions - Accept / Decline */}
          {session.isTeacher && session.status === "requested" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Session Request</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  A learner has requested this session. Accept it and provide a
                  meeting link, or decline.
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="meetingLink"
                      placeholder="https://meet.google.com/..."
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setActionMessage("Session accepted! The learner has been notified.")}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActionMessage("Session declined.")}
                    className="border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mark completed */}
          {session.status === "accepted" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Session Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Once the session is finished, mark it as completed to transfer
                  credits and unlock reviews.
                </p>
                <Button
                  onClick={() => setActionMessage("Session marked as completed! Credits have been transferred.")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Review form */}
          {session.status === "completed" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= rating
                              ? "fill-accent text-accent"
                              : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="How was your experience?"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => setActionMessage("Thank you for your review!")}
                  disabled={!rating}
                >
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
