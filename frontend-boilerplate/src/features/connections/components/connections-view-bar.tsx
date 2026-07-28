/**
 * Faixa entre a busca e o conteúdo: quantas conexões saíram do recorte, à
 * esquerda; como exibi-las, à direita.
 *
 * Mesma peça (e mesmas razões) da `ChartsViewBar`: a contagem é a RESPOSTA à
 * busca que acabou de ser digitada — lida depois da lista, chegaria tarde
 * demais. E `SegmentedControl` em vez de abas porque alternar grade/tabela é
 * um MODO de exibição do mesmo conjunto, não navegação entre seções.
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
export type ConnectionsView = 'grid' | 'table';

export interface ConnectionsViewBarProps {
  /** Conexões exibidas no recorte atual (após a busca). */
  count: number;
  view: ConnectionsView;
  onViewChange: (view: ConnectionsView) => void;
}

export function ConnectionsViewBar({
  count,
  view,
  onViewChange,
}: ConnectionsViewBarProps) {
  return (
    <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
      <Text type="supporting" hasTabularNumbers>
        {count === 1 ? '1 conexão' : `${count} conexões`}
      </Text>
      <SegmentedControl
        value={view}
        onChange={(next) => onViewChange(next as ConnectionsView)}
        label="Modo de exibição das conexões"
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
