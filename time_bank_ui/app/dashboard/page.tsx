"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { KpiCard } from "@/components/kpi-card"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { UpcomingSessions } from "@/components/dashboard/upcoming-sessions"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiRequest } from "@/lib/api"
import {
  Coins,
  Star,
  CalendarCheck,
  CheckCircle2,
  MessageSquare,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from "lucide-react"

type DashboardPayload = {
  profile: {
    full_name: string;
    bio: string;
    timezone: string;
    languages: string;
    level: string;
    offered_skills: string[];
    wanted_skills: string[];
  };
  credit_balance: number;
  credit_stats?: {
    earned_total: number;
    used_total: number;
    current_balance: number;
  };
  rating: number | null;
  personal_stats: {
    total_sessions: number;
    completed_sessions: number;
    reviews_received: number;
  };
  sessions_chart: {
    labels: string[];
    values: number[];
  };
  credits_chart: {
    labels: string[];
    values: number[];
  };
  balance_chart?: {
    labels: string[];
    values: number[];
  };
  upcoming_learning: Array<{
    id: number;
    skill: string;
    partner: string;
    status: string;
    scheduled_at: string | null;
  }>;
  upcoming_teaching: Array<{
    id: number;
    skill: string;
    partner: string;
    status: string;
    scheduled_at: string | null;
  }>;
  recent_activity?: Array<{
    type: string;
    text: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const payload = await apiRequest<DashboardPayload>("dashboard/")
        if (mounted) setData(payload)
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : "Failed to load dashboard."
          setError(message)
          if (message.toLowerCase().includes("authentication")) {
            router.push("/login")
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [router])

  const kpis = useMemo(() => {
    if (!data) return []
    const creditStats = data.credit_stats || {
      earned_total: Math.max(data.credit_balance, 0),
      used_total: 0,
      current_balance: data.credit_balance,
    }
    return [
      { title: "Current Balance", value: creditStats.current_balance, icon: Wallet },
      { title: "Credits Earned", value: creditStats.earned_total, icon: ArrowUpCircle },
      { title: "Credits Used", value: creditStats.used_total, icon: ArrowDownCircle },
      {
        title: "Average Rating",
        value: data.rating !== null ? data.rating.toFixed(1) : "No rating",
        icon: Star,
        description: data.rating !== null ? "out of 5.0" : undefined,
      },
      { title: "My Sessions", value: data.personal_stats.total_sessions, icon: CalendarCheck },
      { title: "Completed", value: data.personal_stats.completed_sessions, icon: CheckCircle2 },
      { title: "Reviews Received", value: data.personal_stats.reviews_received, icon: MessageSquare },
      { title: "Total Credits", value: data.credit_balance, icon: Coins },
    ]
  }, [data])

  const sessionMixData = useMemo(
    () => data?.sessions_chart.labels.map((label, index) => ({ name: label, value: data.sessions_chart.values[index] || 0 })) || [],
    [data]
  )
  const balanceData = useMemo(
    () => {
      const chart = data?.balance_chart || data?.credits_chart
      if (!chart) return []
      return chart.labels.map((month, index) => ({ month, credits: chart.values[index] || 0 }))
    },
    [data]
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              {data ? `Welcome back, ${data.profile.full_name}. Here is your skill barter overview.` : "Loading your overview..."}
            </p>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading dashboard data...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} description={kpi.description} />
                ))}
              </div>

              <div className="mt-8">
                <DashboardCharts sessionMixData={sessionMixData} creditData={balanceData} />
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4" /> Community Feed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(data.recent_activity || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {(data.recent_activity || []).map((item, index) => (
                          <div key={`${item.type}-${item.created_at}-${index}`} className="rounded-md border border-border p-3">
                            <p className="text-sm text-foreground">{item.text}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Credit Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const creditStats = data.credit_stats || {
                        earned_total: Math.max(data.credit_balance, 0),
                        used_total: 0,
                        current_balance: data.credit_balance,
                      }
                      return (
                        <>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-semibold text-foreground">+{creditStats.earned_total}</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Used</p>
                      <p className="text-2xl font-semibold text-foreground">-{creditStats.used_total}</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-semibold text-foreground">{creditStats.current_balance}</p>
                    </div>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <UpcomingSessions
                  learningCards={data.upcoming_learning.map((s) => ({
                    id: s.id,
                    skill: s.skill,
                    partner: s.partner,
                    status: s.status,
                    scheduledAt: s.scheduled_at,
                  }))}
                  teachingCards={data.upcoming_teaching.map((s) => ({
                    id: s.id,
                    skill: s.skill,
                    partner: s.partner,
                    status: s.status,
                    scheduledAt: s.scheduled_at,
                  }))}
                />
              </div>

              <div className="mt-8">
                <ProfileSection
                  fullName={data.profile.full_name}
                  bio={data.profile.bio}
                  timezone={data.profile.timezone}
                  languages={data.profile.languages}
                  level={data.profile.level}
                  offeredSkills={data.profile.offered_skills}
                  wantedSkills={data.profile.wanted_skills}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
