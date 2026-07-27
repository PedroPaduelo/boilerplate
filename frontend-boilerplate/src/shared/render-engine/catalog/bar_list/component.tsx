/**
 * Bloco `bar_list` (shape 'categorical') — ranking "Top N" sobre o `BarList` de
 * `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - o rótulo saiu de DENTRO da barra. Isso apagou de uma vez o cálculo de
 *    luminância WCAG, o parser de cor e o contorno de texto que o legado
 *    carregava só para o nome não sumir na barra colorida;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira token de
 *    dado do DS; `palette: "multi"` cicla a paleta por item;
 *  - a lista já é texto (`<ol>` com rótulo e valor), então não precisa de
 *    equivalente acessível extra — leitor de tela lê a linha inteira.
 */
import type { CategoricalData } from '@dashboards/contracts';
import { BarList, chartAccentColor } from '@/shared/ui';
import type { BarListItem } from '@/shared/ui';
import { formatCompactBRL } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarListProps = {
  sortOrder?: 'ascending' | 'descending' | 'none';
  palette?: 'single' | 'multi' | 'none';
  /** Cor das barras em palette="single"; resolvida para token do DS. */
  accent?: string;
  /**
   * Mantida por compatibilidade de contrato: com o rótulo FORA da barra, a cor
   * do texto passou a ser a de leitura do DS e não precisa (nem deve) ser
   * escolhida por bloco. Ignorada.
   */
  textColor?: string;
};

type CategoryPoint = { label: string; value: number | null };

export const Component: BlockComponent<BarListProps, CategoricalData> = ({
  props,
  data,
  state,
  error,
}) => {
  const items = (data ?? []) as CategoryPoint[];

  // `single` fixa a cor de destaque; `multi` cicla a paleta por item.
  const accent = props.palette === 'single' ? chartAccentColor(props.accent) : undefined;
  const rows: BarListItem[] = items.map((item) => ({
    label: item.label,
    value: item.value ?? 0,
    color: accent,
  }));

  return (
    <BarList
      data={rows}
      sortOrder={props.sortOrder ?? 'descending'}
      hasColorByItem={props.palette === 'multi'}
      valueFormatter={formatCompactBRL}
      isLoading={state === 'loading' || state === 'skeleton'}
      emptyMessage={
        state === 'error' ? (error ?? 'Erro ao carregar os dados') : undefined
      }
    />
  );
};

/** Insights de rodapé: primeiro e último do ranking. */
function deriveTakeaway(data: CategoricalData): string[] | undefined {
  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) return undefined;

  const top = items.reduce((best, item) =>
    (item.value ?? 0) > (best.value ?? 0) ? item : best,
  );
  if ((top.value ?? 0) <= 0) return undefined;

  const insights = [`Top 1: ${top.label} (${formatCompactBRL(top.value ?? 0)})`];

  if (items.length > 1) {
    const bottom = items.reduce((best, item) =>
      (item.value ?? 0) < (best.value ?? 0) ? item : best,
    );
    if ((bottom.value ?? 0) > 0 && bottom !== top) {
      insights.push(`Último: ${bottom.label} (${formatCompactBRL(bottom.value ?? 0)})`);
    }
  }

  return insights;
}

export const definition = defineBlock<BarListProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
