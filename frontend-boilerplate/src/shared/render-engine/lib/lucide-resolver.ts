/**
 * Resolver de ícone lucide — converte um NOME em componente React.
 *
 * SEPARADO de `icons.ts` (que é PURO) porque este importa `lucide-react`
 * (runtime React). Consumido só pelo FE: components do catálogo (ex.: kpi)
 * e o playground (`IconFieldEditor`). NUNCA importe daqui num `manifest.ts`
 * (o manifest precisa ser puro p/ o `build:catalog` do BE).
 */
import type { ComponentType } from 'react';
import { icons as lucideIcons } from 'lucide-react';

/** Tipo mínimo de um ícone lucide (aceita className). */
export type LucideIconComponent = ComponentType<{ className?: string }>;

/**
 * Resolve um nome de ícone (PascalCase "DollarSign" OU kebab/snake/space
 * "dollar-sign") contra o registry do lucide. Retorna `undefined` se não
 * existir — o consumidor degrada suave (renderiza sem ícone, não quebra).
 */
export function resolveLucideIcon(
  name: string | undefined | null,
): LucideIconComponent | undefined {
  if (!name) return undefined;
  const raw = String(name).trim();
  if (!raw) return undefined;
  const registry = lucideIcons as unknown as Record<string, LucideIconComponent>;
  // 1) nome exato (já PascalCase).
  if (registry[raw]) return registry[raw];
  // 2) normaliza kebab/snake/space → PascalCase ("dollar-sign" → "DollarSign").
  const pascal = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return registry[pascal];
}
