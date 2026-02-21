import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, ArrowRight } from "lucide-react"

interface Session {
  id: number
  skill: string
  partner: string
  status: string
  scheduledAt: string | null
}

type UpcomingSessionsProps = {
  learningCards: Session[];
  teachingCards: Session[];
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function SessionRow({ session }: { session: Session }) {
  const dateLabel = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleString()
    : "Date not set";

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
          {initialsFromName(session.partner)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {session.skill}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{session.partner}</span>
          <span>|</span>
          <Calendar className="h-3 w-3" />
          <span>{dateLabel}</span>
        </div>
      </div>
      <StatusBadge status={session.status} />
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function UpcomingSessions({ learningCards, teachingCards }: UpcomingSessionsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Learning</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {learningCards.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Teaching</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {teachingCards.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
