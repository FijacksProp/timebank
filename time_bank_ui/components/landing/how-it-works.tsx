import { UserPlus, Search, Handshake } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description:
      "Sign up and list your skills -- both what you can teach and what you want to learn. Set your timezone, level, and languages.",
    step: "01",
  },
  {
    icon: Search,
    title: "Get Matched",
    description:
      "Our matching engine finds people who want what you teach and teach what you want. Smart scores rank each match for fit.",
    step: "02",
  },
  {
    icon: Handshake,
    title: "Start Bartering",
    description:
      "Request a session, agree on a time, and trade knowledge. Earn credits, build your reputation, and keep learning.",
    step: "03",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Three steps to your first skill swap
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            No money changes hands. Just time, knowledge, and mutual growth.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card
              key={step.step}
              className="group relative overflow-hidden border-border transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-8">
                <span className="font-mono text-5xl font-bold text-muted/80">
                  {step.step}
                </span>
                <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <step.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
