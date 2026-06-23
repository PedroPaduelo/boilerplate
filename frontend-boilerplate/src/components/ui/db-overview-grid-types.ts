import * as React from "react"

/**
 * Tipos do `DbOverviewGrid` — componente de visão geral de uma frota
 * de instâncias de banco de dados. Estilo "fleet" aplicado a
 * Postgres/MySQL/SQLServer/Oracle/SQLite.
 *
 * Foi modelado para responder à pergunta de observabilidade:
 * "a gente tem o banco da auditoria de produção, o banco da
 *  auditoria de homologação, o banco do SGT Maker, o banco do
 *  Nota Fiscal Sync" — e mostrar de relance quem está saudável,
 *  quem está degradado, quem está offline.
 *
 * O componente NÃO conhece `db-schema-explorer`: a expansão
 * detalhada é passada via slot `renderDetail` (render prop), o que
 * evita acoplamento e dispensa deps circulares com o componente
 * irmão `db-schema-explorer` (que vive em uma branch paralela).
 */

export type DbEnvironment = "prod" | "staging" | "dev" | "homolog"

export type DbStatus = "healthy" | "degraded" | "offline"

export type DbEngine = "postgresql" | "mysql" | "sqlserver" | "oracle" | "sqlite"

export type DbTableSummary = {
  name: string
  sizeMB: number
  rowCount: number
}

export type DatabaseInstance = {
  id: string
  name: string
  role: string
  env: DbEnvironment
  engine: DbEngine
  host: string
  port: number
  version: string
  sizeMB: number
  /** Limite opcional do tamanho (em MB) — habilita a barra de progresso. */
  sizeLimitMB?: number
  maxConnections: number
  currentConnections: number
  /** Latência de replicação em ms (omitido para bancos standalone). */
  replicationLagMs?: number
  status: DbStatus
  queriesPerSec: number
  slowQueriesCount: number
  transactionsPerSec: number
  /** 0..1 (proporção de cache hits). */
  cacheHitRatio: number
  /** ISO date string do último backup (omitido = sem backup). */
  lastBackupAt?: string
  /** Top N tabelas (já ordenadas pela exibição no example). */
  topTables: DbTableSummary[]
}

export type DbOverviewGridSortBy =
  | "name"
  | "connections"
  | "size"
  | "latency"
  | "status"

export type DbOverviewGridProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Lista de instâncias a exibir. */
  databases: DatabaseInstance[]
  /** Callback disparado ao clicar em um tile (antes do dialog). */
  onDatabaseClick?: (id: string) => void
  /**
   * Critério de ordenação inicial. Padrão: "status" (offline primeiro,
   * depois degraded, depois healthy — replica a prioridade de SRE).
   */
  sortBy?: DbOverviewGridSortBy
  /**
   * Render prop opcional para o conteúdo do Dialog de detalhe.
   * Recebe o `DatabaseInstance` selecionado e deve retornar ReactNode
   * (ex.: `<DbSchemaExplorer database={db} />`). Quando omitido,
   * renderiza um resumo padrão com as `topTables`.
   */
  renderDetail?: (database: DatabaseInstance) => React.ReactNode
}
