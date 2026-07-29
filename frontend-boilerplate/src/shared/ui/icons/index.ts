/**
 * `@/shared/ui/icons` — os ícones REAIS do sistema AuditorIA, como componentes
 * React offline.
 *
 * Cada componente carrega o traçado exato do SVG do pacote `icones-auditoria`
 * (coleções `solar` e `eva`, grade 24×24, `currentColor`). Nada é baixado em
 * tempo de execução — o porquê está no README deste diretório.
 *
 * Todos aceitam `SVGProps<SVGSVGElement>` e, por isso, encaixam sem adaptador
 * em `<Icon icon={…} />`, `SideNavItem.icon` e qualquer slot do Astryx que peça
 * um `IconType`.
 */

export type { AppIcon } from './types';
export { IconBase } from './icon-base';
export type { IconBaseProps } from './icon-base';

/* Itens do menu — CONTRATO da sidebar §6. */
export {
  CatalogIcon,
  ChartsIcon,
  ChatIcon,
  ConnectionsIcon,
  DashboardsIcon,
  HomeIcon,
  UsersIcon,
} from './nav-icons';

/* Setas e apoio da própria navegação. */
export {
  ArrowIosBackIcon,
  ArrowIosDownwardIcon,
  ArrowIosForwardIcon,
  InfoOutlineIcon,
} from './arrow-icons';

/* Semânticos — consumidos pelo mapa em `../semantic-icons.ts`. */
export {
  ActivityIcon,
  BarChartIcon,
  OverviewIcon,
  PieChartIcon,
  TrendUpIcon,
} from './chart-icons';
export { DatabaseIcon, LayersIcon, ListIcon, TableIcon } from './data-icons';
export {
  BuildingIcon,
  DocumentIcon,
  MoneyIcon,
  PercentIcon,
  TargetIcon,
  TaxIcon,
  UsersGroupIcon,
} from './business-icons';
export {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MapPointIcon,
  NeutralMarkerIcon,
  SearchIcon,
  SettingsIcon,
  TagIcon,
} from './status-icons';
