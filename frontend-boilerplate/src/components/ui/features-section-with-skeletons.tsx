import * as React from "react"
import { motion } from "motion/react"

import { cn } from "@/shared/lib/utils"

export type FeatureItem = {
  /** Título da feature. */
  title: string
  /** Descrição curta exibida abaixo do título. */
  description: string
  /** Conteúdo visual (skeleton/preview) renderizado no topo do card. */
  skeleton: React.ReactNode
  /** Classes extras para o card (controle de span no grid). */
  className?: string
}

export type FeaturesSectionWithSkeletonsProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Cabeçalho da seção. */
  heading?: string
  /** Subtítulo/descrição da seção. */
  subheading?: string
  /** Lista de features exibidas na grade. */
  features: readonly FeatureItem[]
}

function FeatureCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="feature-card"
      className={cn("relative overflow-hidden p-4 sm:p-8", className)}
    >
      {children}
    </div>
  )
}

function FeatureTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto max-w-5xl text-left text-xl tracking-tight text-foreground md:text-2xl md:leading-snug">
      {children}
    </p>
  )
}

function FeatureDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto my-2 max-w-4xl text-left text-sm text-muted-foreground md:text-base">
      {children}
    </p>
  )
}

/**
 * SkeletonImageGrid — grade de imagens com leve rotação e zoom no hover.
 * Útil como preview animado dentro de um card de feature.
 */
export function SkeletonImageGrid({
  images,
}: {
  images: readonly string[]
}) {
  const rotations = ["-3deg", "2deg", "-2deg", "3deg", "-1deg", "1deg"]
  return (
    <div className="relative flex h-full flex-col gap-6 p-2">
      <div className="flex flex-row -ml-12 flex-wrap gap-3">
        {images.map((src, idx) => (
          <motion.div
            key={`${src}-${idx}`}
            style={{ rotate: rotations[idx % rotations.length] }}
            whileHover={{ scale: 1.1, rotate: 0, zIndex: 10 }}
            whileTap={{ scale: 1.1, rotate: 0, zIndex: 10 }}
            className="mt-4 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card p-1"
          >
            <img
              src={src}
              alt="preview"
              loading="lazy"
              className="h-20 w-20 flex-shrink-0 rounded-lg object-cover md:h-40 md:w-40"
            />
          </motion.div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 h-full w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 h-full w-20 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}

/**
 * SkeletonRipple — anel pulsante centralizado, evoca um globo/sinal de rede.
 */
export function SkeletonRipple() {
  return (
    <div className="relative mt-10 flex h-60 flex-col items-center bg-transparent md:h-60">
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="absolute rounded-full border border-border"
            style={{ height: 80 + ring * 60, width: 80 + ring * 60 }}
            animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.05, 1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: ring * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
        <div className="z-10 h-16 w-16 rounded-full bg-gradient-to-br from-foreground/80 to-foreground/40" />
      </div>
    </div>
  )
}

/**
 * SkeletonBars — barras animadas verticais, evocam um gráfico/analytics.
 */
export function SkeletonBars() {
  const bars = [40, 70, 55, 90, 65, 80, 50]
  return (
    <div className="relative flex h-60 items-end justify-center gap-2 px-4">
      {bars.map((height, idx) => (
        <motion.div
          key={idx}
          className="w-6 rounded-t-md bg-gradient-to-t from-foreground/30 to-foreground/70 md:w-8"
          initial={{ height: "20%" }}
          animate={{ height: [`20%`, `${height}%`, `20%`] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: idx * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

function FeaturesSectionWithSkeletons({
  heading = "Tudo que sua equipe precisa",
  subheading = "Da ideia à entrega, uma plataforma completa para construir, lançar e escalar.",
  features,
  className,
  ...props
}: FeaturesSectionWithSkeletonsProps) {
  return (
    <div
      data-slot="features-section-with-skeletons"
      className={cn("relative z-20 mx-auto max-w-7xl py-10 lg:py-20", className)}
      {...props}
    >
      <div className="px-8">
        <h2 className="mx-auto max-w-5xl text-center text-xl font-medium tracking-tight text-foreground lg:text-5xl lg:leading-tight">
          {heading}
        </h2>
        <p className="mx-auto my-4 max-w-2xl text-center text-sm font-normal text-muted-foreground lg:text-base">
          {subheading}
        </p>
      </div>

      <div className="relative">
        <div className="mt-12 grid grid-cols-1 rounded-md border border-border lg:grid-cols-6 xl:border-none">
          {features.map((feature, idx) => (
            <FeatureCard key={feature.title + idx} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  )
}

export { FeaturesSectionWithSkeletons }
