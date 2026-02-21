import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.75_0.15_55_/_0.15),transparent)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-1.5 text-sm text-primary-foreground/80">
          <Sparkles className="h-3.5 w-3.5" />
          The skill barter marketplace
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-primary-foreground md:text-6xl lg:text-7xl">
          Trade Skills,{" "}
          <span className="text-accent">Not Money</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/70 md:text-xl">
          Connect with a global community of freelancers, students, and creators.
          Teach what you know, learn what you need -- all by trading your time.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Sign In
            </Button>
          </Link>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-primary-foreground/50">
          <span>10,000+ skill swaps completed</span>
          <span className="hidden sm:inline">|</span>
          <span>2,500+ active members</span>
          <span className="hidden sm:inline">|</span>
          <span>120+ skill categories</span>
        </div>
      </div>
    </section>
  )
}
