import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Calendar, BookOpen, GraduationCap } from "lucide-react"

interface SessionItem {
  id: string
  skill: string
  partner: string
  partnerInitials: string
  date: string
  status: string
  credits: number
}

const learnerSessions: SessionItem[] = [
  { id: "1", skill: "React Advanced Patterns", partner: "Marcus L.", partnerInitials: "ML", date: "Mar 12, 2026", status: "accepted", credits: 2 },
  { id: "2", skill: "Data Visualization", partner: "Yuki T.", partnerInitials: "YT", date: "Mar 14, 2026", status: "requested", credits: 1 },
  { id: "5", skill: "Python Basics", partner: "Raj P.", partnerInitials: "RP", date: "Feb 28, 2026", status: "completed", credits: 2 },
  { id: "6", skill: "Marketing Strategy", partner: "Sofia M.", partnerInitials: "SM", date: "Feb 20, 2026", status: "declined", credits: 1 },
]

const teacherSessions: SessionItem[] = [
  { id: "3", skill: "UX Research Methods", partner: "Ana R.", partnerInitials: "AR", date: "Mar 13, 2026", status: "accepted", credits: 2 },
  { id: "4", skill: "Design Systems", partner: "Alex K.", partnerInitials: "AK", date: "Mar 10, 2026", status: "completed", credits: 2 },
  { id: "7", skill: "Figma Basics", partner: "Priya S.", partnerInitials: "PS", date: "Feb 15, 2026", status: "cancelled", credits: 1 },
]

function SessionRow({ session }: { session: SessionItem }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
          {session.partnerInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{session.skill}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{session.partner}</span>
          <span>|</span>
          <Calendar className="h-3 w-3" />
          <span>{session.date}</span>
          <span>|</span>
          <span>{session.credits} credits</span>
        </div>
      </div>
      <StatusBadge status={session.status} />
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function SessionList({ sessions }: { sessions: SessionItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} />
      ))}
    </div>
  )
}

export default function SessionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              My Sessions
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track all your learning and teaching sessions in one place.
            </p>
          </div>

          <Tabs defaultValue="learner">
            <TabsList className="mb-6">
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
