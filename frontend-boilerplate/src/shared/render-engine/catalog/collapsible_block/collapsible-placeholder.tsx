/**
 * Placeholder do corpo colapsável sem filhos (galeria do catálogo) — duas
 * células de exemplo que comunicam "aqui entram sub-blocos".
 *
 * A largura de cada célula é declarada em COLUNAS (`GridSpan columns`): o
 * `Grid` do design system traduz para `grid-column`, então o bloco não escreve
 * regra de grid na mão.
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
  { span: 6, label: 'Gráfico' },
  { span: 6, label: 'Tabela' },
] as const;

export function CollapsiblePlaceholder() {
  return (
    <Grid columns={GRID_COLUMNS} gap={3} data-slot="collapsible-placeholder">
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
