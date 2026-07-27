/**
 * Leitura defensiva do contrato de LAYOUT × DADOS (doc 20).
 *
 * Funções PURAS que respondem "em que estado este bloco está?" e "o que o
 * bloco declarou?" a partir de objetos que vêm do backend/do autor do
 * dashboard. Ficam separadas do `BlockRenderer` porque são a parte testável
 * sem DOM — e porque um componente não deve carregar o peso de normalizar
 * dados de terceiros.
 */
import type { Block, BlockDataResult } from '@dashboards/contracts';
import type { BlockFrameTakeaway } from './block-frame';
import type { BlockRenderState } from './types';

/** Resolve o estado de render de um bloco a partir do resultado de dados. */
export function resolveState(
  hasDataContract: boolean,
  result: BlockDataResult | undefined,
): BlockRenderState {
  if (!hasDataContract) return 'success'; // narrativo / layout / container
  if (!result) return 'skeleton';
  switch (result.state) {
    case 'queued':
    case 'running':
      return 'loading';
    case 'error':
      return 'error';
    case 'idle':
      return 'skeleton';
    case 'success': {
      const data = result.data;
      const isEmpty =
        data == null ||
        (Array.isArray(data) && data.length === 0) ||
        (typeof data === 'object' &&
          !Array.isArray(data) &&
          Object.keys(data as object).length === 0);
      return isEmpty ? 'empty' : 'success';
    }
    default:
      return 'skeleton';
  }
}

/** Lê `meta.durationMs` de um resultado (só existe no sucesso). */
export function durationOf(result: BlockDataResult | undefined): number | undefined {
  if (result && typeof result === 'object' && 'meta' in result) {
    const meta = (result as { meta?: { durationMs?: number } }).meta;
    return meta?.durationMs;
  }
  return undefined;
}

/**
 * Lê `block.takeaways` (lista editável pelo playground), descartando em
 * silêncio o que estiver malformado — um insight quebrado nunca deve derrubar
 * o dashboard inteiro.
 */
export function takeawaysOf(block: Block): BlockFrameTakeaway[] {
  const raw = (block as { takeaways?: unknown }).takeaways;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): BlockFrameTakeaway | null => {
      if (entry == null || typeof entry !== 'object') return null;
      const candidate = entry as { enabled?: unknown; text?: unknown };
      if (typeof candidate.text !== 'string') return null;
      return { enabled: Boolean(candidate.enabled), text: candidate.text };
    })
    .filter((entry): entry is BlockFrameTakeaway => entry !== null);
}

/**
 * Normaliza o retorno de `deriveTakeaway` (`string | string[] | undefined`)
 * para o array que a moldura consome. `string` é aceita por retrocompat.
 */
export function normalizeTakeaway(
  raw: string | string[] | undefined,
): BlockFrameTakeaway[] {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
    .map((text) => ({ enabled: true, text: text.trim() }));
}

/** Lê `block.showSql`; `undefined` significa "default = true". */
export function showSqlOf(block: Block): boolean {
  const raw = (block as { showSql?: unknown }).showSql;
  return typeof raw === 'boolean' ? raw : true;
}

/**
 * Título EXPLÍCITO do bloco (sem fallback). Prioridade: `block.title` (o
 * backend o preenche com o título do Chart referenciado) e, como rede de
 * segurança, `block.props.title`.
 */
export function explicitBlockTitle(block: Block): string | undefined {
  const title = (block as { title?: unknown }).title;
  if (typeof title === 'string' && title.trim().length > 0) return title;
  const propsTitle = (block.props as { title?: unknown } | undefined)?.title;
  if (typeof propsTitle === 'string' && propsTitle.trim().length > 0) {
    return propsTitle;
  }
  return undefined;
}
