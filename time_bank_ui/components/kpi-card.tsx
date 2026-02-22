import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  className?: string
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "group h-full transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <CardContent className="flex h-full items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs sm:text-sm font-medium leading-tight text-muted-foreground">{title}</p>
          <p className="mt-1 break-words text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground">
            {value}
          </p>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
