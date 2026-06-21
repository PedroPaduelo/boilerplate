import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export interface ContributionDay {
  date: string
  count: number
}

export interface GitHubContributionsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  data: ContributionDay[]
  weeks?: number
  colorScale?: "green" | "blue" | "shadcn"
}

const CELL_SIZE = 11
const CELL_GAP = 3
const WEEKDAYS = 7

function getLevel(count: number, maxCount: number): number {
  if (count === 0) return 0
  if (maxCount === 0) return 0
  const ratio = count / maxCount
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

function getColorClass(level: number, colorScale: string): string {
  if (level === 0) return "bg-muted-foreground/5"

  if (colorScale === "green") {
    const colors = [
      "",
      "bg-green-200 dark:bg-green-900",
      "bg-green-400 dark:bg-green-700",
      "bg-green-500 dark:bg-green-600",
      "bg-green-700 dark:bg-green-400",
    ]
    return colors[level]
  }

  if (colorScale === "blue") {
    const colors = [
      "",
      "bg-blue-200 dark:bg-blue-900",
      "bg-blue-400 dark:bg-blue-700",
      "bg-blue-500 dark:bg-blue-600",
      "bg-blue-700 dark:bg-blue-400",
    ]
    return colors[level]
  }

  // shadcn (default) — uses muted-foreground opacity scale
  const colors = [
    "",
    "bg-muted-foreground/20",
    "bg-muted-foreground/40",
    "bg-muted-foreground/60",
    "bg-muted-foreground/80",
  ]
  return colors[level]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function buildGridData(
  data: ContributionDay[],
  weeksCount: number
): (ContributionDay | null)[][] {
  const weeks: (ContributionDay | null)[][] = []

  // Sort data by date ascending
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Take the last weeksCount weeks
  const daysToInclude = weeksCount * WEEKDAYS
  const recentDays = sorted.slice(-daysToInclude)

  // Build week columns
  for (let w = 0; w < weeksCount; w++) {
    const week: (ContributionDay | null)[] = []
    for (let d = 0; d < WEEKDAYS; d++) {
      const idx = w * WEEKDAYS + d
      if (idx < recentDays.length) {
        week.push(recentDays[idx])
      } else {
        week.push(null)
      }
    }
    weeks.push(week)
  }

  return weeks
}

function GitHubContributions({
  data,
  weeks: weeksCount = 52,
  colorScale = "shadcn",
  className,
  ...props
}: GitHubContributionsProps) {
  const maxCount = React.useMemo(
    () => Math.max(...data.map((d) => d.count), 0),
    [data]
  )

  const gridData = React.useMemo(
    () => buildGridData(data, weeksCount),
    [data, weeksCount]
  )

  const totalContributions = React.useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data]
  )

  return (
    <div
      data-slot="github-contributions"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div className="flex items-end gap-[3px] overflow-x-auto">
        {gridData.map((week, weekIdx) => (
          <div
            key={weekIdx}
            className="flex flex-col gap-px"
            style={{ width: CELL_SIZE }}
          >
            {week.map((day, dayIdx) => {
              if (!day) {
                return (
                  <div
                    key={dayIdx}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      marginBottom: dayIdx < WEEKDAYS - 1 ? CELL_GAP : 0,
                    }}
                  />
                )
              }

              const level = getLevel(day.count, maxCount)
              const colorClass = getColorClass(level, colorScale)

              return (
                <Tooltip key={dayIdx}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-sm cursor-pointer transition-colors hover:opacity-80",
                        colorClass
                      )}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        marginBottom: dayIdx < WEEKDAYS - 1 ? CELL_GAP : 0,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <span className="font-medium">{day.count}</span> contribution
                      {day.count !== 1 ? "s" : ""} on {formatDate(day.date)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalContributions.toLocaleString()} contributions in the last year</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "rounded-sm",
                getColorClass(level, colorScale)
              )}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

export { GitHubContributions }
