/**
 * O VOCABULÁRIO de `{{interpolação}}` do bloco em edição.
 *
 * Módulo separado (e puro) porque responde a uma pergunta só — "quais variáveis
 * existem para ESTE dado?" — e porque a resposta precisa vir da MESMA função
 * que a moldura usa em runtime (`buildChartScope`). Derivar a lista de qualquer
 * outro lugar seria prometer variável que não resolve.
 */
import { buildChartScope, interpolateText } from '@/shared/ui';

/** Uma variável disponível para interpolar nos textos do bloco. */
export interface PlaygroundVariable {
  /** Nome da variável, sem as chaves (ex.: `total`). */
  key: string;
  /** Valor JÁ resolvido, exatamente como o bloco escreveria. */
  preview: string;
}

/**
 * As variáveis do vocabulário comum, na ordem em que fazem sentido ler
 * (`chart-template.ts`). Vêm primeiro porque existem em todo shape.
 */
const PRIMARY_VARIABLES = [
  'total',
  'maximo',
  'minimo',
  'media',
  'contagem',
  'rotuloMaximo',
  'rotuloMinimo',
  'primeiro',
  'ultimo',
  'valor',
  'unidade',
  'series',
];

/**
 * Apelidos em inglês do mesmo valor (`max`, `avg`, `count`…) e as coleções
 * cruas (`dados`, `linhas`). Continuam funcionando na interpolação; ficam fora
 * da LISTA para não transformar dez variáveis úteis em trinta linhas de ruído —
 * as coleções aparecem na dica de caminho (`{{dados.0.valor}}`).
 */
const ALIAS_VARIABLES = new Set([
  'soma',
  'max',
  'min',
  'avg',
  'count',
  'first',
  'last',
  'maxLabel',
  'minLabel',
  'value',
  'unit',
  'nomesSeries',
  'dados',
  'linhas',
  'colunas',
]);

/** Só entram na lista os valores que cabem num rótulo. */
function isPrintable(value: unknown): boolean {
  return (
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
  );
}

/**
 * Lista as variáveis disponíveis PARA O DADO ATUAL, já com o valor resolvido.
 *
 * O escopo é o mesmo que a moldura usa (`buildChartScope`), então o que aparece
 * aqui é exatamente o que `{{chave}}` vai renderizar — inclusive no bloco
 * narrativo, onde o JSON livre do painel serve só para isto.
 */
export function availableVariables(data: unknown): PlaygroundVariable[] {
  const scope = buildChartScope(data);
  const extras = Object.keys(scope)
    .filter((key) => !PRIMARY_VARIABLES.includes(key) && !ALIAS_VARIABLES.has(key))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return [...PRIMARY_VARIABLES.filter((key) => key in scope), ...extras]
    .filter((key) => isPrintable(scope[key]))
    .map((key) => ({ key, preview: interpolateText(`{{${key}}}`, scope) }));
}
