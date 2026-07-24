import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Seção com animação de entrada (fade + slide up) e stagger por índice.
 * Segue o motion do design system: opacity 0->1, y 10->0, 0.4s easeOut,
 * delay = 0.04 * index.
 */
export function Section({
  index = 0,
  id,
  className,
  children,
}: {
  index?: number;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.04 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/** Cabeçalho de seção: eyebrow (overline) + título + descrição + ações. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        {/* Título expressivo: escala maior e tracking negativo (-0.02em), o
            traço que dá o ar "produto premium" em Linear/Vercel/Stripe.
            `text-balance` evita a última linha órfã em títulos longos. */}
        <h3 className="text-balance text-2xl font-semibold leading-[1.15] tracking-[-0.02em] sm:text-3xl">
          {title}
        </h3>
        {description ? (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
