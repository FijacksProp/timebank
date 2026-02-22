"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    const newErrors: Record<string, string> = {}
    if (!username.trim()) newErrors.username = "Username is required"
    if (!password) newErrors.password = "Password is required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      setLoading(true)
      await apiRequest("auth/login/", {
        method: "POST",
        body: {
          username: username.trim(),
          password,
        },
      })
      router.push("/dashboard")
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Time Bank</span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to continue trading skills
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="maria"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-medium text-accent underline-offset-4 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {serverError && <p className="text-xs text-destructive">{serverError}</p>}

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Don't have an account?"}{" "}
            <Link
              href="/signup"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
