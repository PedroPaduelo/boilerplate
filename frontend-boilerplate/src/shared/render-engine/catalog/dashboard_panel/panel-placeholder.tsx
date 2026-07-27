/**
 * Placeholder do painel sem filhos (galeria do catálogo) — uma grade de
 * indicadores de exemplo que comunica "aqui entram sub-blocos".
 *
 * A largura de cada célula é declarada em COLUNAS (`GridSpan columns`), não em
 * regra de CSS: quem traduz para `grid-column` é o `Grid` do design system.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';

/** Total de colunas do sub-grid de filhos (mesmo contrato do `BlockGrid`). */
const GRID_COLUMNS = 12;
/** Altura da célula ilustrativa — só o bastante para ler o rótulo. */
const CELL_HEIGHT = 80;

const CELLS = [
  { id: 'kpi-1', span: 3, label: 'KPI' },
  { id: 'kpi-2', span: 3, label: 'KPI' },
  { id: 'kpi-3', span: 3, label: 'KPI' },
  { id: 'kpi-4', span: 3, label: 'KPI' },
  { id: 'chart', span: 8, label: 'Gráfico' },
  { id: 'donut', span: 4, label: 'Donut' },
] as const;

export function DashboardPanelPlaceholder() {
  return (
    <Grid columns={GRID_COLUMNS} gap={3} data-slot="dashboard-panel-placeholder">
      {CELLS.map((cell) => (
        <GridSpan key={cell.id} columns={cell.span}>
          <Card variant="muted" padding={0}>
            <Center minHeight={CELL_HEIGHT}>
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
