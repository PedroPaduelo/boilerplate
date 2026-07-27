/**
 * DashboardRenderer — motor de render base (doc 03 / doc 32 §4).
 *
 * Recebe um `DashboardLayout` ({ filters, rows }) + (opcional) o payload de
 * DADOS batch e renderiza a tela: barra de filtros + linhas de blocos no grid
 * de 12 colunas. Cada bloco é resolvido pelo registry via `BlockRenderer`;
 * tipos desconhecidos caem no aviso do próprio bloco, então um layout com um
 * tipo novo nunca derruba a tela inteira.
 */
import type {
  DashboardLayout,
  DashboardDataPayload,
  Filter,
  Row,
} from '@dashboards/contracts';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { BlockGrid } from './block-grid';
import { BlockRenderer } from './block-renderer';

export interface DashboardRendererProps {
  layout: DashboardLayout;
  /** Payload de dados batch (mapa blockId → resultado). Opcional. */
  data?: DashboardDataPayload;
  /**
   * Aplica a moldura (`BlockFrame`) nos blocos de visualização. Default
   * `true` (dashboard real). A GALERIA do catálogo passa `false`.
   */
  framed?: boolean;
  className?: string;
}

export function DashboardRenderer({
  layout,
  data,
  framed = true,
  className,
}: DashboardRendererProps) {
  return (
    <VStack gap={6} data-slot="dashboard" className={className}>
      {layout.filters.length > 0 ? (
        <HStack gap={2} wrap="wrap" vAlign="center" data-slot="dashboard-filters">
          {layout.filters.map((filter: Filter) => (
            <Token
              key={filter.id}
              label={filter.label ?? filter.id}
              description={`Filtro do tipo ${filter.type}`}
              size="sm"
              data-testid="dashboard-filter"
            />
          ))}
        </HStack>
      ) : null}

      {layout.rows.map((row: Row) => (
        <VStack key={row.id} gap={3} as="section" data-slot="dashboard-row">
          {row.title ? <Heading level={2}>{row.title}</Heading> : null}
          <BlockGrid
            blocks={row.blocks}
            renderBlock={(block) => (
              <BlockRenderer
                block={block}
                data={data}
                result={data?.blocks?.[block.id]}
                framed={framed}
              />
            )}
            slot="dashboard-grid"
            cellSlot="dashboard-cell"
          />
        </VStack>
      ))}
    </VStack>
  );
}
