/**
 * Contratos do playground de blocos (`BlockPlayground` e seus painéis).
 *
 * Vive num módulo próprio porque é consumido pelos painéis, pelos hooks de
 * estado e pela tela de detalhe do gráfico (`/charts/:id`), que semeia o
 * playground e lê o snapshot editável para persistir.
 */
import type { BlockDataResult } from '@dashboards/contracts';

/** Item de takeaway (insight de rodapé) — espelha o tipo de `ChartWidget`. */
export interface Takeaway {
  enabled: boolean;
  text: string;
}

/**
 * Estado do bloco no preview. Espelha `BlockFrameState`/`ChartFrameState` — o
 * contrato comum diz que TODO bloco cobre os cinco, então o playground precisa
 * conseguir mostrar os cinco.
 */
export type PlaygroundState = 'success' | 'loading' | 'empty' | 'error' | 'forbidden';

/**
 * Campos de texto do cabeçalho. Todos aceitam Markdown e `{{variavel}}`, e é
 * neles que a ajuda de variáveis insere a chave clicada.
 */
export type PlaygroundTextField = 'title' | 'subtitle' | 'description' | 'emptyMessage';

/** Valores iniciais para semear o playground (usado pela tela do gráfico). */
export interface PlaygroundSeed {
  props?: Record<string, unknown>;
  title?: string;
  subtitle?: string;
  /** Texto de ajuda do cabeçalho. Aceita Markdown e `{{variavel}}`. */
  description?: string;
  /** Mensagem do estado vazio. Aceita Markdown e `{{variavel}}`. */
  emptyMessage?: string;
  query?: string;
  durationMs?: number;
  takeaways?: Takeaway[];
  showSql?: boolean;
}

/** Dados REAIS (modo `live`): resultado da query + controles de re-execução. */
export interface LiveData {
  /** Resultado da execução da query do gráfico (no shape do dataContract). */
  result: BlockDataResult | undefined;
  /** Query em execução (mostra spinner + desabilita "Rodar query"). */
  isFetching: boolean;
  /** Re-executa a query (refetch). */
  onRun: () => void;
}

/**
 * Estado editável do playground. É o que a tela do gráfico persiste no draft
 * (título/props/query) — `dataText` e `previewState` só valem para o preview.
 */
export interface PlaygroundConfig {
  props: Record<string, unknown>;
  title: string;
  subtitle: string;
  /** Texto de ajuda do cabeçalho (vai para `block.description`). */
  description: string;
  /** Mensagem do estado vazio (vai para `block.emptyMessage`). */
  emptyMessage: string;
  query: string;
  /** `''` quando não informado (input numérico vazio). */
  durationMs: number | '';
  takeaways: Takeaway[];
  showSql: boolean;
  /** Estado simulado no preview — não é persistido, só desenha. */
  previewState: PlaygroundState;
}

/** Snapshot reportado via `onChange` — config + o JSON de dados do preview. */
export interface PlaygroundSnapshot extends PlaygroundConfig {
  dataText: string;
}

/** Subconjunto do JSON Schema de uma prop que o editor sabe renderizar. */
export interface PropSchema {
  type?: string | string[];
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  description?: string;
  /**
   * Schema dos ITENS, quando `type: 'array'`. É o que decide o controle: lista
   * de escalares vira campo separado por vírgula; lista de objetos vira JSON.
   * Sem este campo, props de lista caíam no editor de texto genérico e o valor
   * salvo virava string — o defeito que derrubava blocos que iteram a lista.
   */
  items?: PropSchema;
}

/** `manifest.propsSchema` na forma que o editor consome. */
export interface PropsSchemaLike {
  properties?: Record<string, PropSchema>;
  required?: string[];
}

/** Uma prop configurável, já resolvida a partir do `propsSchema`. */
export interface PropField {
  key: string;
  schema: PropSchema;
  required: boolean;
}

/** Abas do painel de configuração. */
export type PlaygroundTab = 'props' | 'wrapper' | 'data';
