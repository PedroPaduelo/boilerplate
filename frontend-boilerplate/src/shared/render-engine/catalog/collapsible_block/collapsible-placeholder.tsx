/**
 * Placeholder do corpo colapsável sem filhos (galeria do catálogo) — duas
 * células DO MESMO TAMANHO, que é o que a grade do bloco promete.
 *
 * A largura vinha em `span` (6/6 de 12) e agora vem da mesma configuração de
 * coluna do bloco real (`{minWidth, max}`), colapso incluso.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Grid } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import { BLOCK_COLUMN_MIN_WIDTH } from '../../lib/block-sizing';

/** Altura da célula ilustrativa — só o bastante para ler o rótulo. */
const CELL_HEIGHT = 80;

const CELLS = ['Gráfico', 'Tabela'] as const;

export function CollapsiblePlaceholder() {
  return (
    <Grid
      columns={{ minWidth: BLOCK_COLUMN_MIN_WIDTH, max: CELLS.length }}
      gap={4}
      align="stretch"
      data-slot="collapsible-placeholder"
    >
      {CELLS.map((label) => (
        <Card key={label} variant="muted" padding={0} height="100%">
          <Center minHeight={CELL_HEIGHT} height="100%">
            <Text type="supporting" color="secondary">
              {label}
            </Text>
          </Center>
        </Card>
      ))}
    </Grid>
  );
}
