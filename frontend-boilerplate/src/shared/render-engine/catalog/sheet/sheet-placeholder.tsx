/**
 * Placeholder do painel sem filhos (galeria do catálogo) — três células
 * empilhadas que comunicam "aqui entram sub-blocos".
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/** Altura da célula ilustrativa — só o bastante para ler o rótulo. */
const CELL_HEIGHT = 96;

const CELLS = ['Gráfico de detalhe', 'Tabela de apoio', 'Notas'] as const;

export function SheetPlaceholder() {
  return (
    <VStack gap={3} data-slot="sheet-placeholder">
      {CELLS.map((label) => (
        <Card key={label} variant="muted" padding={0}>
          <Center minHeight={CELL_HEIGHT}>
            <Text type="supporting" color="secondary">
              {label}
            </Text>
          </Center>
        </Card>
      ))}
    </VStack>
  );
}
