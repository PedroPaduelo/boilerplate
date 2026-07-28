/**
 * Faixa entre os filtros e o conteúdo: quantos itens saíram do recorte, à
 * esquerda; como exibi-los, à direita.
 *
 * A contagem subiu para cá (antes vivia embaixo da tabela) porque ela é a
 * RESPOSTA ao filtro que acabou de ser aplicado: lida depois da lista, chega
 * tarde demais para quem só quer saber se a busca achou algo.
 *
 * `SegmentedControl` e não abas: alternar grade/tabela é um MODO de exibição
 * do mesmo conjunto, não navegação entre seções — abas prometeriam conteúdos
 * diferentes em cada lado. É a mesma escolha que Superset, Metabase e Power BI
 * fazem nas bibliotecas deles.
 */
import { LayoutGrid, Rows3 } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/Layout';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';

/** Modos de exibição da listagem. */
export type ChartsView = 'grid' | 'table';

export interface ChartsViewBarProps {
  /** Itens exibidos no recorte atual (após os filtros de cliente). */
  count: number;
  view: ChartsView;
  onViewChange: (view: ChartsView) => void;
}

export function ChartsViewBar({ count, view, onViewChange }: ChartsViewBarProps) {
  return (
    <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
      <Text type="supporting" hasTabularNumbers>
        {count === 1 ? '1 gráfico' : `${count} gráficos`} nesta página
      </Text>
      <SegmentedControl
        value={view}
        onChange={(next) => onViewChange(next as ChartsView)}
        label="Modo de exibição dos gráficos"
        size="sm"
      >
        <SegmentedControlItem
          value="grid"
          label="Grade"
          icon={<Icon icon={LayoutGrid} size="sm" />}
        />
        <SegmentedControlItem
          value="table"
          label="Tabela"
          icon={<Icon icon={Rows3} size="sm" />}
        />
      </SegmentedControl>
    </HStack>
  );
}
