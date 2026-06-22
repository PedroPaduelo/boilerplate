import type { ReactNode } from 'react';

/**
 * Página placeholder das rotas-esqueleto da Fase 0. Cada trilha FE (T-F/T-G/T-H)
 * substitui o `features/<x>/routes.tsx` correspondente pela tela real.
 */
export function PlaceholderPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {description ?? 'Tela em construção (esqueleto da Fase 0).'}
      </p>
      {children}
    </div>
  );
}
