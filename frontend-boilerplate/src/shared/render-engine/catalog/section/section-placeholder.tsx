/**
 * Placeholder da `section` sem filhos (galeria do catálogo) — três células DO
 * MESMO TAMANHO, que é o que a seção promete a quem compõe.
 *
 * As larguras vinham em `span` (4/4/4 de 12) e agora vêm da mesma configuração
 * de coluna do bloco real (`{minWidth, max}`): o que a galeria mostra passa a
 * ser o comportamento de verdade, colapso incluso.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Grid } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import { BLOCK_COLUMN_MIN_WIDTH } from '../../lib/block-sizing';

/** Altura da célula ilustrativa — só o bastante para ler o rótulo. */
const CELL_HEIGHT = 80;

const CELLS = ['KPI', 'Gráfico', 'Tabela'] as const;

export function SectionPlaceholder() {
  return (
    <Grid
      columns={{ minWidth: BLOCK_COLUMN_MIN_WIDTH, max: CELLS.length }}
      gap={4}
      align="stretch"
      data-slot="section-placeholder"
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
