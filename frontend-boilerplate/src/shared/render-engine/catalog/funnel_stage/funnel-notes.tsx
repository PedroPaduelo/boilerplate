/**
 * NOTAS da etapa de funil — as observações que a consulta declara com
 * `tipo='nota'`, exibidas ao fim do detalhamento.
 *
 * Vive fora de `funnel-rows.tsx` porque não é tabela: é um bloco de leitura
 * (título + valor + explicação) num card recuado, e misturar os dois num
 * arquivo só já o empurrava para além do limite de tamanho do projeto.
 *
 * CONTRATO COMUM: título e descrição passam por `ChartText` — aceitam Markdown
 * inline e `{{variavel}}`. O valor continua texto puro: markdown em número
 * formatado não significa nada.
 */
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartText } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';
import type { FunnelNote } from './funnel-data';

export interface FunnelNotesProps {
  /** Observações declaradas pela consulta, na ordem em que vieram. */
  notes: FunnelNote[];
  /** Formata os valores monetários (definido pela prop `valueFormat`). */
  money: (value: unknown) => string;
  /** Escopo de interpolação dos textos (de `buildChartScope`). */
  scope: ChartScope;
}

/** Observações da etapa, ao fim do detalhamento. */
export function FunnelNotes({ notes, money, scope }: FunnelNotesProps) {
  if (notes.length === 0) return null;

  return (
    <>
      {notes.map((note) => (
        <Card key={note.key} padding={3} variant="muted">
          <VStack gap={1}>
            <HStack gap={3} hAlign="between" vAlign="center">
              <Text weight="semibold">
                <ChartText value={note.title} scope={scope} />
              </Text>
              {note.value != null ? (
                <Text weight="semibold" hasTabularNumbers>
                  {money(note.value)}
                </Text>
              ) : null}
            </HStack>
            {note.description ? (
              <Text type="supporting" color="secondary">
                <ChartText value={note.description} scope={scope} />
              </Text>
            ) : null}
          </VStack>
        </Card>
      ))}
    </>
  );
}
