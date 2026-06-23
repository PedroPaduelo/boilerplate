import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { workExperienceComponentVariants } from "@/components/ui/work-experience-component-variants"

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                     */
/* -------------------------------------------------------------------------- */

export interface Stat {
  /** Rótulo exibido abaixo do valor (ex.: "Hours/Day"). */
  label: string
  /** Valor numérico/textual em destaque (ex.: "8.4"). */
  value: string
}

export interface WorkExperienceItem {
  company: string
  role: string
  period: string
  /** Texto corrido (`string`) ou lista de responsabilidades (`string[]`). */
  description?: string | string[]
  technologies?: string[]
  logo?: string
  href?: string
  /** Cards de estatísticas renderizados ao final do item. */
  stats?: Stat[]
}

export type WorkExperienceVariant = "timeline" | "card"

export interface WorkExperienceProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof workExperienceComponentVariants> {
  /** Lista de experiências profissionais. */
  experiences: readonly WorkExperienceItem[]
  /** Estilo de visualização. @default "timeline" */
  variant?: WorkExperienceVariant
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function CompanyLogo({ src, name }: { src?: string; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} logo`}
        className="h-8 w-8 rounded-md object-cover"
      />
    )
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
      {initials}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Item individual                                                           */
/* -------------------------------------------------------------------------- */

function ExperienceCard({
  item,
}: {
  item: WorkExperienceItem
}) {
  const companyContent = item.href ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      {item.company}
      <svg
        aria-hidden="true"
        className="h-3 w-3 opacity-60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </a>
  ) : (
    item.company
  )

  const logo = <CompanyLogo src={item.logo} name={item.company} />

  return (
    <Card className="relative border-0 bg-transparent shadow-none">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-1 pt-0">
        {logo}
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm leading-tight">
            {item.role}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            {companyContent}
            <span className="opacity-40">•</span>
            <span>{item.period}</span>
          </div>
        </div>
      </CardHeader>
      {(item.description ||
        (item.technologies && item.technologies.length > 0) ||
        (item.stats && item.stats.length > 0)) && (
        <CardContent className="space-y-2 pb-0 pl-11">
          {item.description && (
            <CardDescription className="text-xs leading-relaxed">
              {Array.isArray(item.description) ? (
                <ul className="list-disc list-inside space-y-0.5 marker:text-muted-foreground">
                  {item.description.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : (
                item.description
              )}
            </CardDescription>
          )}
          {item.technologies && item.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-[10px]">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
          {item.stats && item.stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {item.stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-md border border-border bg-card p-2 text-center"
                >
                  <div className="text-sm font-semibold text-foreground">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Timeline                                                                  */
/* -------------------------------------------------------------------------- */

function TimelineVariant({
  experiences,
  className,
  ...props
}: Omit<WorkExperienceProps, "variant">) {
  return (
    <div
      data-slot="work-experience"
      className={cn("relative", className)}
      {...props}
    >
      {/* Linha vertical */}
      <div
        aria-hidden="true"
        className="absolute bottom-2 left-[15px] top-2 w-px bg-border"
      />

      <ol className="relative space-y-0">
        {experiences.map((exp, i) => (
          <li key={`${exp.company}-${exp.role}-${i}`} className="relative pl-10">
            {/* Bullet */}
            <span className="absolute left-[11px] top-[18px] h-[9px] w-[9px] rounded-full border-2 border-border bg-background" />

            {/* Card */}
            <div className="pb-6">
              <ExperienceCard
                item={exp}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Card list (sem timeline)                                                  */
/* -------------------------------------------------------------------------- */

function CardVariant({
  experiences,
  className,
  ...props
}: Omit<WorkExperienceProps, "variant">) {
  return (
    <div
      data-slot="work-experience"
      className={cn("space-y-4", className)}
      {...props}
    >
      {experiences.map((exp, i) => (
        <Card key={`${exp.company}-${exp.role}-${i}`}>
          <ExperienceCard item={exp} />
        </Card>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

function WorkExperienceComponent({
  experiences,
  className,
  variant = "timeline",
  ...props
}: WorkExperienceProps) {
  if (variant === "card") {
    return (
      <CardVariant
        experiences={experiences}
        className={cn(workExperienceComponentVariants({ variant }), className)}
        {...props}
      />
    )
  }

  return (
    <TimelineVariant
      experiences={experiences}
      className={cn(workExperienceComponentVariants({ variant }), className)}
      {...props}
    />
  )
}

export { WorkExperienceComponent }
