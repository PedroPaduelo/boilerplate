import { iconForBlockType } from '@dashboards/contracts';

import {
  ActivityIcon,
  AlertIcon,
  BarChartIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DatabaseIcon,
  DocumentIcon,
  LayersIcon,
  ListIcon,
  MapPointIcon,
  MoneyIcon,
  NeutralMarkerIcon,
  OverviewIcon,
  PercentIcon,
  PieChartIcon,
  SearchIcon,
  SettingsIcon,
  TableIcon,
  TagIcon,
  TargetIcon,
  TaxIcon,
  TrendUpIcon,
  UsersGroupIcon,
} from './icons';
import type { AppIcon } from './icons';

/**
 * O tipo de um ícone da aplicação. Reexportado daqui porque este módulo é a
 * porta de entrada de quem só quer "um ícone" e não conhece `./icons`.
 */
export type { AppIcon };

/**
 * Ícone SEMÂNTICO (do contrato) → ícone de verdade (do pacote real do
 * AuditorIA, em `./icons`).
 *
 * Mora em `shared/ui` (e não na feature de dashboards) porque tem DOIS
 * consumidores em camadas diferentes: a navegação de abas (feature) e a moldura
 * de card do render-engine (shared). Deixá-lo na feature obrigaria o
 * render-engine a importar de `features/` — inversão de camada — e duplicá-lo
 * garantiria que os dois mapas divergissem no primeiro ícone acrescentado.
 *
 * O layout guarda "money", não "MoneyIcon". Essa indireção é o que permite que
 * o agente escolha por SIGNIFICADO — ele sabe que a aba fala de arrecadação,
 * não qual SVG a versão atual do design system tem — e o que deixa a biblioteca
 * de ícones ser trocada sem reescrever nenhum dashboard salvo. Foi exatamente
 * essa indireção que absorveu a troca do `lucide-react` pelos ícones reais
 * (Solar/eva): mudou só a coluna da direita, nenhum dashboard salvo.
 *
 * O mesmo mapa serve ABA e BLOCO: o vocabulário do contrato é um só
 * (`SEMANTIC_ICONS`), porque "isto é sobre arrecadação" é a mesma frase na
 * navegação e no cabeçalho de um card. Dois mapas divergiriam no primeiro
 * ícone acrescentado.
 *
 * Nome desconhecido cai no marcador neutro em vez de sumir: um item sem ícone
 * quebraria o alinhamento da lista inteira, e é melhor um ponto discreto do que
 * um buraco.
 *
 * Qual desenho Solar/eva cada chave recebeu — e por que, quando a coleção não
 * tinha equivalente — está no JSDoc de cada componente em `./icons`.
 */
const ICON_MAP: Record<string, AppIcon> = {
  overview: OverviewIcon, //     solar:feed-broken
  chart: BarChartIcon, //        solar:chart-2-bold-duotone
  trend: TrendUpIcon, //         solar:graph-up-bold
  table: TableIcon, //           solar:checklist-minimalistic-bold-duotone
  money: MoneyIcon, //           solar:dollar-minimalistic-bold-duotone
  tax: TaxIcon, //               solar:bill-list-bold-duotone
  users: UsersGroupIcon, //      solar:users-group-rounded-bold-duotone
  building: BuildingIcon, //     solar:case-minimalistic-bold
  calendar: CalendarIcon, //     solar:calendar-bold-duotone
  alert: AlertIcon, //           solar:danger-triangle-bold-duotone
  map: MapPointIcon, //          solar:map-point-bold-duotone
  document: DocumentIcon, //     solar:document-bold-duotone
  search: SearchIcon, //         eva:search-fill        (Solar sem lupa no pacote)
  target: TargetIcon, //         solar:flag-bold
  clock: ClockIcon, //           solar:clock-circle-bold-duotone
  tag: TagIcon, //               solar:tag-horizontal-bold-duotone
  percent: PercentIcon, //       solar:sale-bold-duotone  (substituto oficial)
  activity: ActivityIcon, //     eva:activity-fill      (Solar sem pulso no pacote)
  layers: LayersIcon, //         solar:documents-bold-duotone
  check: CheckIcon, //           solar:check-circle-bold-duotone
  database: DatabaseIcon, //     solar:ssd-round-bold
  pie: PieChartIcon, //          solar:pie-chart-bold-duotone
  list: ListIcon, //             solar:list-bold
  settings: SettingsIcon, //     solar:settings-bold-duotone
};

/**
 * Marcador usado quando o item não declara ícone (ou declara um desconhecido):
 * `eva:radio-button-off-fill`, um anel vazio. Neutro de propósito — qualquer
 * símbolo aqui afirmaria algo que o item não disse.
 */
export const FALLBACK_ICON: AppIcon = NeutralMarkerIcon;

/** Ícone de um nome semântico. Desconhecido/ausente → marcador neutro. */
export function semanticIcon(name?: string): AppIcon {
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
): AppIcon | undefined {
  const name = declared ?? iconForBlockType(blockType);
  if (!name) return undefined;
  return ICON_MAP[name];
}
