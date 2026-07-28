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
 * NOMES APOSENTADOS PELO LUCIDE → nome atual do registry.
 *
 * A partir da 0.4xx o lucide renomeou a família de gráficos e a de status
 * (`BarChart3` → `ChartColumn`, `AlertTriangle` → `TriangleAlert`…). Os nomes
 * antigos continuam EXPORTADOS como alias no pacote, mas sumiram do objeto
 * `icons` — que é justamente por onde este resolver procura. Resultado medido
 * na auditoria de inércia (`catalog/__audit__`): cinco dos trinta ícones de
 * `kpi.icon` — `BarChart3`, `LineChart`, `PieChart`, `AlertTriangle` e
 * `CheckCircle2` — resolviam para `undefined` e renderizavam o card SEM ÍCONE.
 * Cinco valores do enum, um único desenho: para quem escolhe (e para o agente
 * que lê o manifesto) a prop simplesmente não funcionava.
 *
 * A correção é aqui, e não em `icons.ts`: aquele enum é CONTRATO — está nos
 * painéis já salvos e no prompt do agente. Trocar `BarChart3` por
 * `ChartColumn` no contrato quebraria todo painel salvo; traduzir na fronteira
 * conserta os antigos E aceita os novos, que é a mesma decisão que
 * `chart-accent.ts` tomou para o vocabulário de cor.
 */
const RENAMED_ICONS: Record<string, string> = {
  BarChart3: 'ChartColumn',
  BarChart2: 'ChartNoAxesColumn',
  BarChart: 'ChartNoAxesColumnIncreasing',
  LineChart: 'ChartLine',
  PieChart: 'ChartPie',
  AreaChart: 'ChartArea',
  AlertTriangle: 'TriangleAlert',
  AlertCircle: 'CircleAlert',
  AlertOctagon: 'OctagonAlert',
  CheckCircle2: 'CircleCheckBig',
  CheckCircle: 'CircleCheck',
  XCircle: 'CircleX',
  HelpCircle: 'CircleHelp',
  PauseCircle: 'CirclePause',
  PlayCircle: 'CirclePlay',
  PlusCircle: 'CirclePlus',
  MinusCircle: 'CircleMinus',
  StopCircle: 'CircleStop',
  MoreHorizontal: 'Ellipsis',
  MoreVertical: 'EllipsisVertical',
};

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
  if (registry[pascal]) return registry[pascal];
  // 3) nome aposentado pelo lucide (o vocabulário dos painéis já salvos).
  const renamed = RENAMED_ICONS[pascal];
  return renamed ? registry[renamed] : undefined;
}
