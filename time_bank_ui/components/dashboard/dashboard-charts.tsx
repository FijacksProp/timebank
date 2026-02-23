"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const COLORS = [
  "oklch(0.75 0.15 55)",
  "oklch(0.65 0.12 160)",
  "oklch(0.80 0.14 80)",
  "oklch(0.55 0.1 230)",
  "oklch(0.62 0.18 18)",
]

type ChartsProps = {
  sessionMixData: Array<{ name: string; value: number }>;
  creditData: Array<{ month: string; credits: number }>;
}

export function DashboardCharts({ sessionMixData, creditData }: ChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Status Mix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sessionMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sessionMixData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creditData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 75)" />
                <XAxis dataKey="month" stroke="oklch(0.5 0.02 60)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.02 60)" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="credits"
                  stroke="oklch(0.75 0.15 55)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.75 0.15 55)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
