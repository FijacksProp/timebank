import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pencil, Globe, Languages, MapPin } from "lucide-react"

type ProfileSectionProps = {
  fullName: string;
  bio: string;
  timezone: string;
  languages: string;
  level: string;
  offeredSkills: string[];
  wantedSkills: string[];
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ProfileSection({
  fullName,
  bio,
  timezone,
  languages,
  level,
  offeredSkills,
  wantedSkills,
}: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">My Profile Details</CardTitle>
        <Link href="/onboarding">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 md:flex-row md:gap-10">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {initialsFromName(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold text-foreground">{fullName || "Time Bank User"}</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {bio || "Add a short bio in onboarding so others understand your strengths."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {timezone || "UTC"}
                </span>
                <span className="flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5" /> {languages || "-"}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> {level || "beginner"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Skills I Teach
            </h4>
            <div className="flex flex-wrap gap-2">
              {offeredSkills.length > 0 ? offeredSkills.map(
                (skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                )
              ) : <span className="text-sm text-muted-foreground">No teaching skills yet.</span>}
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Skills I Want to Learn
            </h4>
            <div className="flex flex-wrap gap-2">
              {wantedSkills.length > 0 ? wantedSkills.map(
                (skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-accent/30 text-accent"
                  >
                    {skill}
                  </Badge>
                )
              ) : <span className="text-sm text-muted-foreground">No target skills yet.</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
