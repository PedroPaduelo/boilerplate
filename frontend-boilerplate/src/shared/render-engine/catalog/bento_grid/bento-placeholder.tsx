/**
 * Placeholder do mosaico sem filhos (galeria do catálogo) — um destaque grande
 * e células menores, só para comunicar o conceito do bento.
 *
 * Cada célula declara largura (`columns`) e altura (`rows`) em unidades de
 * GRID; o `Grid`/`GridSpan` do design system traduz para CSS.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import type { SpacingStep } from '@astryxdesign/core/Layout';

export interface BentoPlaceholderProps {
  columns: number;
  gap: SpacingStep;
  rowHeight: number;
}

/** Mosaico ilustrativo: 1 destaque grande + 4 menores. */
function cellsFor(columns: number) {
  const half = Math.max(1, Math.floor(columns / 2));
  const third = Math.max(1, Math.floor(columns / 3));
  return [
    {
      id: 'destaque',
      span: Math.max(1, Math.ceil(columns / 2)),
      rows: 2,
      label: 'Gráfico em destaque',
    },
    { id: 'kpi', span: half, rows: 1, label: 'KPI' },
    { id: 'donut', span: half, rows: 1, label: 'Donut' },
    { id: 'tabela', span: third, rows: 1, label: 'Tabela' },
    { id: 'linha', span: Math.max(1, columns - third), rows: 1, label: 'Linha' },
  ];
}

export function BentoPlaceholder({ columns, gap, rowHeight }: BentoPlaceholderProps) {
  return (
    <Grid
      columns={columns}
      gap={gap}
      rowHeight={rowHeight}
      data-slot="bento-grid-placeholder"
    >
      {cellsFor(columns).map((cell) => (
        <GridSpan
          key={cell.id}
          columns={Math.min(columns, cell.span)}
          rows={cell.rows > 1 ? cell.rows : undefined}
        >
          <Card variant="muted" padding={0} height="100%">
            <Center height="100%">
              <Text type="supporting" color="secondary">
                {cell.label}
              </Text>
            </Center>
          </Card>
        </GridSpan>
      ))}
    </Grid>
  );
}
