import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Database,
  DollarSign,
  FileText,
  Layers,
  LayoutDashboard,
  List,
  MapPin,
  Percent,
  PieChart,
  Receipt,
  Search,
  Settings,
  Table2,
  Tag,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { iconForBlockType } from '@dashboards/contracts';

/**
 * Ícone SEMÂNTICO (do contrato) → ícone de verdade (da biblioteca).
 *
 * Mora em `shared/ui` (e não na feature de dashboards) porque tem DOIS
 * consumidores em camadas diferentes: a navegação de abas (feature) e a moldura
 * de card do render-engine (shared). Deixá-lo na feature obrigaria o
 * render-engine a importar de `features/` — inversão de camada — e duplicá-lo
 * garantiria que os dois mapas divergissem no primeiro ícone acrescentado.
 *
 * O layout guarda "money", não "DollarSign". Essa indireção é o que permite que
 * o agente escolha por SIGNIFICADO — ele sabe que a aba fala de arrecadação,
 * não qual SVG a versão atual do design system tem — e o que deixa a biblioteca
 * de ícones ser trocada sem reescrever nenhum dashboard salvo.
 *
 * O mesmo mapa serve ABA e BLOCO: o vocabulário do contrato é um só
 * (`SEMANTIC_ICONS`), porque "isto é sobre arrecadação" é a mesma frase na
 * navegação e no cabeçalho de um card. Dois mapas divergiriam no primeiro
 * ícone acrescentado.
 *
 * Nome desconhecido cai no marcador neutro em vez de sumir: um item sem ícone
 * quebraria o alinhamento da lista inteira, e é melhor um ponto discreto do que
 * um buraco.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  chart: BarChart3,
  trend: TrendingUp,
  table: Table2,
  money: DollarSign,
  tax: Receipt,
  users: Users,
  building: Building2,
  calendar: CalendarDays,
  alert: AlertTriangle,
  map: MapPin,
  document: FileText,
  search: Search,
  target: Target,
  clock: Clock,
  tag: Tag,
  percent: Percent,
  activity: Activity,
  layers: Layers,
  check: CheckCircle2,
  database: Database,
  pie: PieChart,
  list: List,
  settings: Settings,
};

/** Marcador usado quando o item não declara ícone (ou declara um desconhecido). */
export const FALLBACK_ICON = Circle;

/** Ícone de um nome semântico. Desconhecido/ausente → marcador neutro. */
export function semanticIcon(name?: string): LucideIcon {
  if (!name) return FALLBACK_ICON;
  return ICON_MAP[name] ?? FALLBACK_ICON;
}

/**
 * Ícone de uma ABA. Alias mantido porque é como a navegação sempre chamou —
 * trocar o nome no lugar de uso não acrescentaria nada.
 */
export const tabIcon = semanticIcon;

/**
 * Ícone de um BLOCO: o declarado no layout, senão o derivado do TIPO
 * (`bar_chart` → gráfico, `donut` → composição…), que é a regra do contrato.
 *
 * Devolve `undefined` — e não o marcador neutro — quando não há nem um nem
 * outro: no cabeçalho de um card, um pontinho cinza ao lado do título é ruído,
 * não âncora. A regra do fallback vale para LISTA (onde o alinhamento depende
 * de todo item ter um ícone), não para um card isolado.
 */
export function blockIcon(
  declared: string | undefined,
  blockType: string | undefined,
): LucideIcon | undefined {
  const name = declared ?? iconForBlockType(blockType);
  if (!name) return undefined;
  return ICON_MAP[name];
}
