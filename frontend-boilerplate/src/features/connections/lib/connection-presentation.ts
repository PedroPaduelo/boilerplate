import type { BadgeVariant } from '@astryxdesign/core/Badge';
import type { StatusDotVariant } from '@astryxdesign/core/StatusDot';
import type { Connection, ConnectionEnvironment, ConnectionVisibility } from '../types';

/**
 * Tradução de dado de domínio → vocabulário visual do design system.
 *
 * Fica em `lib/` (e não dentro dos componentes) porque é a mesma decisão em
 * três telas — lista, workbench e barra de status — e porque é pura: entra
 * string do backend, sai variante de token. Sem isto, cada tela reinventaria o
 * mapeamento e "OK" ficaria verde num lugar e cinza no outro.
 */

export interface ConnectionStatusView {
  variant: StatusDotVariant;
  label: string;
}

/** Status de conectividade reportado pelo backend (test) → ponto de status + rótulo. */
export function connectionStatusView(status: string): ConnectionStatusView {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'OK' || normalized === 'ACTIVE' || normalized === 'CONNECTED') {
    return { variant: 'success', label: 'Conectado' };
  }
  if (normalized === 'ERROR' || normalized === 'FAILED' || normalized === 'INACTIVE') {
    return { variant: 'error', label: 'Falha' };
  }
  return { variant: 'neutral', label: 'Não testado' };
}

const VISIBILITY_LABELS: Record<ConnectionVisibility, string> = {
  PRIVATE: 'Privada',
  DEPARTMENT: 'Departamento',
  ORG: 'Organização',
};

export function visibilityLabel(visibility: ConnectionVisibility): string {
  return VISIBILITY_LABELS[visibility] ?? visibility;
}

export interface EnvironmentView {
  label: string;
  variant: BadgeVariant;
}

const ENVIRONMENT_VIEWS: Record<ConnectionEnvironment, EnvironmentView> = {
  DEV: { label: 'Dev', variant: 'neutral' },
  HOMOLOG: { label: 'Homologação', variant: 'orange' },
  PRODUCTION: { label: 'Produção', variant: 'red' },
};

/**
 * Ambiente DECLARADO no cadastro → rótulo + variante do badge.
 *
 * Até esta versão o ambiente era ADIVINHADO no cliente: procurava-se
 * "homolog"/"staging"/"dev"/"local" no nome da conexão e do banco e, quando
 * nada casava, cravava-se "Produção". Errava nos dois sentidos — marcava banco
 * de teste como produção e, pior, dava selo cinza de "Dev" para produção de
 * verdade sempre que o nome continha "local" (ex.: `arrecadacao_local`). Numa
 * ferramenta de auditoria o rótulo de ambiente orienta cuidado, então virou
 * dado de verdade: `Connection.environment`, escolhido por quem cadastra.
 *
 * Sem fallback esperto: valor desconhecido é exibido cru, em vez de ser
 * silenciosamente traduzido para outra coisa.
 */
export function environmentView(environment: ConnectionEnvironment): EnvironmentView {
  return ENVIRONMENT_VIEWS[environment] ?? { label: environment, variant: 'neutral' };
}

/** É uma conexão que fala HTTP com um gateway (em vez de TCP com o banco)? */
export function isGatewayConnection(connection: Pick<Connection, 'type'>): boolean {
  return connection.type === 'API_GATEWAY';
}

export interface ConnectionTypeView {
  label: string;
  variant: BadgeVariant;
}

/**
 * Tipo da fonte → rótulo curto para badge.
 *
 * Vale a pena ocupar espaço com isto porque o tipo muda o que o usuário pode
 * esperar da tela: numa conexão via gateway não há índices, chaves nem tamanho
 * de tabela para explorar (o gateway não expõe), e a query passa por uma ponte
 * HTTP com limite próprio. Ver "API" no cabeçalho explica antecipadamente
 * ausências que, sem o rótulo, pareceriam defeito.
 */
export function connectionTypeView(type: string): ConnectionTypeView {
  if (type === 'API_GATEWAY') return { label: 'API', variant: 'purple' };
  return { label: 'PostgreSQL', variant: 'info' };
}

/**
 * Endereço da fonte, em uma linha — o que de fato identifica a conexão nas
 * listagens.
 *
 * Postgres é `host:porta/banco`. Gateway é a URL (sem o esquema, que só
 * gastaria espaço) e, quando conhecido, o nome do banco que ele expõe: o
 * `host:443/` de uma URL https não diria nada a ninguém.
 */
export function connectionEndpoint(
  connection: Pick<Connection, 'type' | 'host' | 'port' | 'database' | 'baseUrl'>,
): string {
  if (!isGatewayConnection(connection)) {
    return `${connection.host}:${connection.port}/${connection.database}`;
  }
  const base = (connection.baseUrl ?? connection.host).replace(/^https?:\/\//i, '');
  return connection.database ? `${base} · ${connection.database}` : base;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** Bytes → string curta ("340 MB", "1.2 GB"). "—" quando não há valor. */
export function formatBytes(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return '—';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    value >= 100 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${BYTE_UNITS[unit]}`;
}

/** Megabytes (unidade do view-model do schema) → string curta. */
export function formatSizeMB(sizeMB?: number | null): string {
  if (sizeMB == null || sizeMB <= 0) return '—';
  return formatBytes(sizeMB * 1024 * 1024);
}

/** Contagem compacta: 8_400_000 → "8.4M". */
export function formatCount(value?: number | null): string {
  if (value == null) return '—';
  if (value < 1_000) return String(value);
  if (value < 1_000_000) return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return `${(value / 1_000_000_000).toFixed(1)}B`;
}
