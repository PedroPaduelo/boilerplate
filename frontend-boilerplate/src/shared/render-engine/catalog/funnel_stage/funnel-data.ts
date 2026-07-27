/**
 * Leitura dos DADOS da etapa de funil — separada do desenho porque é a parte
 * que precisa ser defensiva: o bloco recebe uma tabela genérica (`shape:
 * 'table'`) montada com UNION ALL, onde a coluna `tipo` diz o papel de cada
 * linha (`resumo`, `desfecho`, `total`, `nota`).
 *
 * Uma consulta mal montada não pode derrubar o painel: linha sem `tipo`
 * reconhecido é descartada em silêncio, número que não é número vira `null` e
 * o componente mostra o traço de "sem valor".
 */
import type { TableData } from '@dashboards/contracts';
import { toNumber } from '@/shared/lib/format';

/** Linha crua da tabela (o contrato não fixa colunas neste bloco). */
type Row = Record<string, unknown>;

/** Cabeçalho da etapa: quantidade, participação no universo e valor. */
export interface FunnelSummary {
  quantity: number | null;
  /** Participação no universo, de 0 a 1. */
  fraction: number;
  /** `true` quando a consulta declarou a participação. */
  hasFraction: boolean;
  value: number | null;
}

/** Uma linha de desfecho da etapa. */
export interface FunnelOutcome {
  key: string;
  /** Nome de ícone (resolvido pelo registry do catálogo). */
  icon?: string;
  title: string;
  description?: string;
  quantity: number | null;
  quantityLabel?: string;
  original: number | null;
  updated: number | null;
}

/** Linha de fechamento da etapa. */
export interface FunnelTotal {
  title: string;
  quantity: number | null;
  original: number | null;
  updated: number | null;
}

/** Observação exibida ao fim do detalhamento. */
export interface FunnelNote {
  key: string;
  title: string;
  description?: string;
  value: number | null;
}

/** A etapa inteira, já normalizada. */
export interface FunnelStage {
  summary?: FunnelSummary;
  outcomes: FunnelOutcome[];
  total?: FunnelTotal;
  notes: FunnelNote[];
}

/** Texto de uma célula, ou `undefined` quando vazia. */
function text(value: unknown): string | undefined {
  if (value == null) return undefined;
  const raw = String(value).trim();
  return raw === '' ? undefined : raw;
}

/** Interpreta as linhas da consulta nos quatro papéis da etapa. */
export function readFunnelStage(data: TableData | undefined): FunnelStage {
  const rows = ((data?.rows ?? []) as Row[]).filter(
    (row): row is Row => row != null && typeof row === 'object',
  );

  const summaryRow = rows.find((row) => row.tipo === 'resumo');
  const totalRow = rows.find((row) => row.tipo === 'total');

  const summary: FunnelSummary | undefined = summaryRow
    ? {
        quantity: toNumber(summaryRow.quantidade),
        // A participação é fração (0..1); fora da faixa, grampeia — barra com
        // 140% de largura seria um bug visível no lugar de um dado suspeito.
        fraction: Math.min(1, Math.max(0, toNumber(summaryRow.pct) ?? 0)),
        hasFraction: summaryRow.pct != null,
        value: toNumber(summaryRow.valor),
      }
    : undefined;

  const outcomes: FunnelOutcome[] = rows
    .filter((row) => row.tipo === 'desfecho')
    .map((row, index) => ({
      key: `${text(row.desfecho) ?? 'desfecho'}-${index}`,
      icon: text(row.icone),
      title: text(row.desfecho) ?? '—',
      description: text(row.descricao),
      quantity: toNumber(row.quantidade),
      quantityLabel: text(row.quantidade_label),
      original: toNumber(row.valor_original),
      updated: toNumber(row.valor_atualizado),
    }));

  const total: FunnelTotal | undefined = totalRow
    ? {
        title: text(totalRow.desfecho) ?? 'Total',
        quantity: toNumber(totalRow.quantidade),
        original: toNumber(totalRow.valor_original),
        updated: toNumber(totalRow.valor_atualizado),
      }
    : undefined;

  const notes: FunnelNote[] = rows
    .filter((row) => row.tipo === 'nota')
    .map((row, index) => ({
      key: `${text(row.desfecho) ?? 'nota'}-${index}`,
      title: text(row.desfecho) ?? '—',
      description: text(row.descricao),
      value: toNumber(row.valor_atualizado),
    }));

  return { summary, outcomes, total, notes };
}

/**
 * Peso de cada desfecho na barra: usa o valor original e cai na quantidade
 * quando ele não vem — é o que mantém a barra proporcional ao DINHEIRO, que é
 * a leitura do funil.
 */
export function outcomeWeights(outcomes: FunnelOutcome[]): number[] {
  return outcomes.map((outcome) => Math.abs(outcome.original ?? outcome.quantity ?? 0));
}
