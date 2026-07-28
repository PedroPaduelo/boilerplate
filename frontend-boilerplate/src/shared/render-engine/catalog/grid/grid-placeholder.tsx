/**
 * Placeholder do grid sem filhos (galeria do catálogo) — três células do MESMO
 * tamanho, que é justamente o que o bloco promete.
 *
 * As células usam a mesma configuração de coluna do bloco real
 * (`{minWidth, max}`), então o que a galeria mostra é o comportamento de
 * verdade — inclusive o colapso ao estreitar a janela — e não um desenho
 * estático que pode divergir do componente.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Grid } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import { BLOCK_COLUMN_MIN_WIDTH } from '../../lib/block-sizing';

/** Altura da célula ilustrativa — só o bastante para ler o rótulo. */
const CELL_HEIGHT = 96;

const CELLS = ['Gráfico', 'Gráfico', 'Tabela'] as const;

export function GridPlaceholder({ columns }: { columns: number }) {
  return (
    <Grid
      columns={{ minWidth: BLOCK_COLUMN_MIN_WIDTH, max: columns }}
      gap={4}
      align="stretch"
      data-slot="grid-placeholder"
    >
      {CELLS.map((label, index) => (
        <Card key={`${label}-${index}`} variant="muted" padding={0} height="100%">
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
