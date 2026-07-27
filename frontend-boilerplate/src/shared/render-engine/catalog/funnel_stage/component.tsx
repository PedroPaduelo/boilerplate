/**
 * Bloco `funnel_stage` (shape 'table') — uma ETAPA de funil temporal como
 * painel colapsável. Self-contained: desenha o próprio card, sem a moldura de
 * gráfico.
 *
 * O que mudou na migração:
 *  - a paleta cravada em hex/rgba (blue/red/green/amber/violet) saiu por
 *    inteiro. A cor agora vem das RAMPAS sequenciais do design system, via
 *    `useChartPalette` — os desfechos são partes ordenadas de um mesmo todo,
 *    que é exatamente o que uma rampa comunica;
 *  - o abre/fecha é o `Collapsible` do DS (foco, teclado e `aria-expanded`
 *    prontos), no lugar do botão com `useState` e chevron girado à mão;
 *  - o detalhamento virou tabela de verdade (`funnel-rows.tsx`) e a leitura dos
 *    dados, defensiva e testável, ficou em `funnel-data.ts`.
 */
import type { TableData } from '@dashboards/contracts';
import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ChartRampColor } from '@/shared/ui';
import {
  formatBRL,
  formatCompactBRL,
  formatNumberBR,
  formatPercentBR,
} from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { FunnelBar } from './funnel-bar';
import { FunnelRows } from './funnel-rows';
import { outcomeWeights, readFunnelStage } from './funnel-data';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** Cores aceitas pela etapa (contrato do bloco — não mudam de nome). */
type AccentKey = 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate';

type FunnelStageProps = {
  stageLabel: string;
  accent?: AccentKey;
  defaultOpen?: boolean;
  barLabel?: string;
  valueFormat?: 'BRL' | 'compactBRL';
};

/** Cor da etapa → rampa sequencial do design system. */
const RAMP: Record<AccentKey, ChartRampColor> = {
  blue: 'blue',
  red: 'red',
  green: 'shamrock',
  amber: 'orange',
  violet: 'purple',
  slate: 'gray',
};

export const Component: BlockComponent<FunnelStageProps, TableData> = ({
  props,
  data,
}) => {
  const { summary, outcomes, total, notes } = readFunnelStage(data);
  const money = (value: unknown) =>
    props.valueFormat === 'compactBRL' ? formatCompactBRL(value) : formatBRL(value);

  if (!summary && outcomes.length === 0 && !total) {
    return (
      <Card padding={4} data-slot="funnel-stage">
        <EmptyState isCompact title="Sem dados para esta etapa" />
      </Card>
    );
  }

  const fraction = summary?.fraction ?? 0;
  const participation = summary?.hasFraction
    ? `${formatPercentBR(fraction, 2)} dos lançamentos`
    : undefined;

  return (
    <Card padding={4} data-slot="funnel-stage">
      <Collapsible
        defaultIsOpen={Boolean(props.defaultOpen)}
        trigger={
          // `as="span"` em toda a árvore do gatilho: ele é um <button>, e o
          // conteúdo de um botão precisa ser texto/inline — não <div>.
          <VStack as="span" gap={2} width="100%">
            <Text type="label" color="secondary">
              {props.stageLabel}
            </Text>

            <HStack as="span" gap={3} hAlign="between" vAlign="end" wrap="wrap">
              <Text type="supporting" weight="semibold" hasTabularNumbers>
                {summary?.quantity != null ? formatNumberBR(summary.quantity, 0) : '—'}
                {participation ? ` — ${participation}` : ''}
              </Text>
              <Text type="display-3" hasTabularNumbers>
                {money(summary?.value)}
              </Text>
            </HStack>

            <FunnelBar
              fraction={fraction}
              weights={outcomeWeights(outcomes)}
              color={RAMP[props.accent ?? 'blue']}
              label={`${props.stageLabel}: ${participation ?? 'participação no universo'}`}
            />

            {props.barLabel ? (
              <Text type="supporting" color="secondary">
                {props.barLabel}
              </Text>
            ) : null}
          </VStack>
        }
      >
        <VStack gap={3}>
          <FunnelRows outcomes={outcomes} total={total} money={money} />

          {notes.map((note) => (
            <Card key={note.key} padding={3} variant="muted">
              <VStack gap={1}>
                <HStack gap={3} hAlign="between" vAlign="center">
                  <Text weight="semibold">{note.title}</Text>
                  {note.value != null ? (
                    <Text weight="semibold" hasTabularNumbers>
                      {money(note.value)}
                    </Text>
                  ) : null}
                </HStack>
                {note.description ? (
                  <Text type="supporting" color="secondary">
                    {note.description}
                  </Text>
                ) : null}
              </VStack>
            </Card>
          ))}
        </VStack>
      </Collapsible>
    </Card>
  );
};

export const definition = defineBlock<FunnelStageProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
