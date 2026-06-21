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
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
          {title}
        </h3>
        {description ? (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
