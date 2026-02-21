import { Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Priya S.",
    initials: "PS",
    role: "UX Designer",
    text: "I taught Figma skills and learned Python in return. Time Bank made the swap seamless and fair.",
    rating: 5,
  },
  {
    name: "Marcus L.",
    initials: "ML",
    role: "CS Student",
    text: "As a student with no budget for tutors, this platform changed everything. I now have 3 regular barter partners.",
    rating: 5,
  },
  {
    name: "Yuki T.",
    initials: "YT",
    role: "Freelance Writer",
    text: "I traded copywriting sessions for web development help. Both sides walked away with real value.",
    rating: 5,
  },
]

export function SocialProof() {
  return (
    <section className="bg-secondary px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Testimonials
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Trusted by learners and teachers worldwide
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6 transition-shadow duration-200 hover:shadow-md"
            >
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground">
                {`"${t.text}"`}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
