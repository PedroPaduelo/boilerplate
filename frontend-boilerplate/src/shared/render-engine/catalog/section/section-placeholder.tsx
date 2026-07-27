/**
 * Placeholder da `section` sem filhos (galeria do catálogo) — três células de
 * exemplo que comunicam "aqui entram sub-blocos".
 *
 * A largura de cada célula é declarada em COLUNAS (`GridSpan columns`), não em
 * regra de CSS: o `Grid` do design system é quem traduz isso para o
 * `grid-column` — por isso não existe `style` inline aqui.
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
  { span: 4, label: 'KPI' },
  { span: 4, label: 'Gráfico' },
  { span: 4, label: 'Tabela' },
] as const;

export function SectionPlaceholder() {
  return (
    <Grid columns={GRID_COLUMNS} gap={3} data-slot="section-placeholder">
      {CELLS.map((cell) => (
        <GridSpan key={cell.label} columns={cell.span}>
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
