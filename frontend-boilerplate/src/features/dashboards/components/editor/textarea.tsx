import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Textarea simples no estilo dos inputs da Vitrine/shadcn. Usado pelos editores
 * narrativos (markdown do `rich_text`) e pelo form de `dataBinding` (SQL). Não há
 * um `textarea` no barrel da Vitrine, então mantemos este primitivo local ao
 * editor (T-G2) — arquivo só de componente (sem violar `react-refresh`).
 */
export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
