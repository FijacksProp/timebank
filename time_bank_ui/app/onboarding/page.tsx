"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, ArrowRight, ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiRequest } from "@/lib/api"

const STEPS = ["Personal Info", "Skills & Interests", "Preferences"]

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
]

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Hindi",
  "Japanese",
  "Portuguese",
  "Arabic",
  "Korean",
]

type OnboardingProfile = {
  full_name: string;
  bio: string;
  timezone: string;
  languages: string;
  level: string;
  offered_skills: string[];
  wanted_skills: string[];
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [level, setLevel] = useState("beginner")
  const [teachSkills, setTeachSkills] = useState<string[]>([])
  const [learnSkills, setLearnSkills] = useState<string[]>([])
  const [teachInput, setTeachInput] = useState("")
  const [learnInput, setLearnInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const progress = ((step + 1) / STEPS.length) * 100

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const payload = await apiRequest<{ profile: OnboardingProfile }>("onboarding/")
        if (!mounted) return
        const p = payload.profile
        setName(p.full_name || "")
        setBio(p.bio || "")
        setTimezone(p.timezone || "UTC")
        setLevel(p.level || "beginner")
        setTeachSkills(p.offered_skills || [])
        setLearnSkills(p.wanted_skills || [])
        setSelectedLangs(
          (p.languages || "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        )
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load onboarding data.")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  function addSkill(
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) {
    const trimmed = input.trim()
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed])
    }
    setInput("")
  }

  function toggleLang(lang: string) {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  async function handleComplete() {
    setError("")
    if (!name.trim()) {
      setError("Full name is required.")
      setStep(0)
      return
    }
    try {
      setSaving(true)
      await apiRequest("onboarding/", {
        method: "POST",
        body: {
          full_name: name.trim(),
          bio,
          timezone,
          languages: selectedLangs.join(", "),
          level,
          offered_skills: teachSkills,
          wanted_skills: learnSkills,
        },
      })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Clock className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Time Bank</span>
          </Link>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pt-8 sm:px-6">
        <Progress value={progress} className="h-2" />
        <div className="mt-3 flex justify-between">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-xs font-medium ${i <= step ? "text-accent" : "text-muted-foreground"}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading onboarding...</p>
        ) : (
          <div className="flex-1">
            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

            {step === 0 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
                  <p className="mt-1 text-sm text-muted-foreground">This helps others find and connect with you.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="A short intro about yourself, your background, and your interests..."
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/300 characters</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your skills and interests</h2>
                  <p className="mt-1 text-sm text-muted-foreground">What can you teach, and what do you want to learn?</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Skills I Can Teach</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. JavaScript, Guitar, Photography"
                      value={teachInput}
                      onChange={(e) => setTeachInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addSkill(teachInput, setTeachInput, teachSkills, setTeachSkills)
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" size="icon" onClick={() => addSkill(teachInput, setTeachInput, teachSkills, setTeachSkills)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teachSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1 py-1">
                        {skill}
                        <button type="button" onClick={() => setTeachSkills(teachSkills.filter((s) => s !== skill))} aria-label={`Remove ${skill}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Skills I Want to Learn</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. UX Design, Spanish, Data Science"
                      value={learnInput}
                      onChange={(e) => setLearnInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addSkill(learnInput, setLearnInput, learnSkills, setLearnSkills)
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" size="icon" onClick={() => addSkill(learnInput, setLearnInput, learnSkills, setLearnSkills)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {learnSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1 py-1">
                        {skill}
                        <button type="button" onClick={() => setLearnSkills(learnSkills.filter((s) => s !== skill))} aria-label={`Remove ${skill}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Almost there!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Set your level and languages to improve matching.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Experience Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Languages You Speak</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLang(lang)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          selectedLangs.includes(lang)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-card text-muted-foreground hover:border-accent/50"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={loading}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleComplete} disabled={loading || saving}>
              {saving ? "Saving..." : "Complete Setup"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
