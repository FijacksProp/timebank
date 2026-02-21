import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  requested: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  accepted: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  declined: "bg-destructive/10 text-destructive border-destructive/30",
  completed: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  cancelled: "bg-muted text-muted-foreground border-border",
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] ?? statusStyles.cancelled
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        style,
        className
      )}
    >
      {status}
    </span>
  )
}
