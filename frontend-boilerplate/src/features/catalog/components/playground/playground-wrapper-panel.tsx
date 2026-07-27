/**
 * Aba "Cabeçalho / Rodapé" — o formulário do wrapper `ChartWidget`.
 *
 * É o formulário de EDIÇÃO do gráfico em `/charts/:id`: título e query são
 * persistidos no draft. Por isso a validação é inline no campo (`status` →
 * `FieldStatus`), nunca por toast.
 */
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Switch } from '@astryxdesign/core/Switch';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatDuration } from '@/shared/lib/format';
import type { PlaygroundConfig } from './types';

export interface PlaygroundWrapperPanelProps {
  config: PlaygroundConfig;
  onPatch: (partial: Partial<PlaygroundConfig>) => void;
  /** Placeholder do título quando vazio (nome do bloco). */
  titlePlaceholder: string;
  /** Em `/charts/:id` o título é persistido — vazio vira erro inline. */
  isTitleRequired: boolean;
  /** Modo live: a duração vem da execução real e o campo fica read-only. */
  isLive: boolean;
}

const SQL_OFF_REASON = '"Mostrar SQL" está desligado — ligue para editar o rodapé.';

export function PlaygroundWrapperPanel({
  config,
  onPatch,
  titlePlaceholder,
  isTitleRequired,
  isLive,
}: PlaygroundWrapperPanelProps) {
  const titleError = isTitleRequired && config.title.trim().length === 0;
  const duration =
    typeof config.durationMs === 'number' && Number.isFinite(config.durationMs)
      ? formatDuration(config.durationMs)
      : '—';

  return (
    <VStack gap={4}>
      <Heading level={4}>Cabeçalho e rodapé</Heading>

      <TextInput
        label="Título"
        size="sm"
        value={config.title}
        placeholder={titlePlaceholder}
        isRequired={isTitleRequired}
        status={titleError ? { type: 'error', message: 'Informe um título.' } : undefined}
        onChange={(title) => onPatch({ title })}
      />

      <TextInput
        label="Subtítulo"
        size="sm"
        value={config.subtitle}
        placeholder="(vazio)"
        isOptional
        onChange={(subtitle) => onPatch({ subtitle })}
      />

      <Switch
        label="Mostrar SQL no rodapé"
        description="Desligado, o rodapé esconde a query e a duração."
        labelPosition="start"
        labelSpacing="spread"
        value={config.showSql}
        onChange={(showSql) => onPatch({ showSql })}
      />

      <TextArea
        label="Query SQL"
        size="sm"
        rows={4}
        value={config.query}
        placeholder="SELECT ... FROM ..."
        hasSpellCheck={false}
        isDisabled={!config.showSql}
        disabledMessage={SQL_OFF_REASON}
        description="Aparece no rodapé do card e é salva no vínculo de dados."
        onChange={(query) => onPatch({ query })}
      />

      <VStack gap={1}>
        <NumberInput
          label="Duração (ms)"
          size="sm"
          min={0}
          value={config.durationMs === '' ? null : config.durationMs}
          placeholder="ex.: 142"
          hasClear
          isDisabled={!config.showSql || isLive}
          disabledMessage={
            isLive ? 'A duração vem da execução real da query.' : SQL_OFF_REASON
          }
          onChange={(next) => onPatch({ durationMs: next ?? '' })}
        />
        <Text type="supporting">No rodapé: {duration}</Text>
      </VStack>
    </VStack>
  );
}
