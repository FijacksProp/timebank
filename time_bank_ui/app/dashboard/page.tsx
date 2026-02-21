"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { KpiCard } from "@/components/kpi-card"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { UpcomingSessions } from "@/components/dashboard/upcoming-sessions"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { apiRequest } from "@/lib/api"
import {
  Coins,
  TrendingUp,
  Star,
  CalendarCheck,
  CheckCircle2,
  MessageSquare,
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
}

export default function DashboardPage() {
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
          setError(err instanceof Error ? err.message : "Failed to load dashboard.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const kpis = useMemo(() => {
    if (!data) return []
    return [
      { title: "Credits", value: data.credit_balance, icon: Coins },
      { title: "Profile Level", value: data.profile.level, icon: TrendingUp },
      {
        title: "Average Rating",
        value: data.rating !== null ? data.rating.toFixed(1) : "No rating",
        icon: Star,
        description: data.rating !== null ? "out of 5.0" : undefined,
      },
      { title: "My Sessions", value: data.personal_stats.total_sessions, icon: CalendarCheck },
      { title: "Completed", value: data.personal_stats.completed_sessions, icon: CheckCircle2 },
      { title: "Reviews Received", value: data.personal_stats.reviews_received, icon: MessageSquare },
    ]
  }, [data])

  const sessionMixData = useMemo(
    () => data?.sessions_chart.labels.map((label, index) => ({ name: label, value: data.sessions_chart.values[index] || 0 })) || [],
    [data]
  )
  const creditData = useMemo(
    () => data?.credits_chart.labels.map((month, index) => ({ month, credits: data.credits_chart.values[index] || 0 })) || [],
    [data]
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              {data ? `Welcome back, ${data.profile.full_name}. Here is your skill barter overview.` : "Loading your overview..."}
            </p>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading dashboard data...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} description={kpi.description} />
                ))}
              </div>

              <div className="mt-8">
                <DashboardCharts sessionMixData={sessionMixData} creditData={creditData} />
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
