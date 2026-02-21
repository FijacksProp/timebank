import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-8 py-16 text-center md:px-16">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
          Ready to trade your first skill?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-primary-foreground/70">
          Join thousands of people who are growing by sharing. No credit card, no fees -- just your time and expertise.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
