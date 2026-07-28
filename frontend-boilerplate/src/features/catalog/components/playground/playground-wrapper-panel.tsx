/**
 * Aba "Cabeçalho" — o CONTRATO COMUM de todo bloco do catálogo, num só lugar
 * (`PLANO.md` §4):
 *
 *   1. cabeçalho — título, subtítulo, descrição e mensagem de estado vazio,
 *      todos com Markdown + `{{variavel}}` (`PlaygroundHeaderFields`);
 *   2. variáveis — o vocabulário disponível para o dado atual, clicável
 *      (`PlaygroundVariables` insere no campo em foco);
 *   3. estados — sucesso / carregando / vazio / erro / sem permissão;
 *   4. rodapé técnico — query SQL e duração.
 *
 * É o formulário de EDIÇÃO do gráfico em `/charts/:id`: título e query são
 * persistidos no draft. Por isso a validação é inline no campo (`status` →
 * `FieldStatus`), nunca por toast.
 */
import { useState } from 'react';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Switch } from '@astryxdesign/core/Switch';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Divider } from '@astryxdesign/core/Divider';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatDuration } from '@/shared/lib/format';
import { PlaygroundHeaderFields } from './playground-header-fields';
import { HEADER_FIELD_LABEL, PLAYGROUND_STATE_LABEL } from './playground-helpers';
import { PlaygroundVariables } from './playground-variables';
import type { PlaygroundConfig, PlaygroundState, PlaygroundTextField } from './types';

export interface PlaygroundWrapperPanelProps {
  config: PlaygroundConfig;
  onPatch: (partial: Partial<PlaygroundConfig>) => void;
  /** Placeholder do título quando vazio (nome do bloco). */
  titlePlaceholder: string;
  /** Em `/charts/:id` o título é persistido — vazio vira erro inline. */
  isTitleRequired: boolean;
  /** Modo live: a duração vem da execução real e o campo fica read-only. */
  isLive: boolean;
  /** Dado atual do preview — origem das `{{variaveis}}` da ajuda. */
  data: unknown;
  /** Etiqueta que o card exibe ao lado do título (nome do tipo do bloco). */
  badgeLabel: string;
}

const SQL_OFF_REASON = '"Mostrar SQL" está desligado — ligue para editar o rodapé.';

/** Ordem do seletor de estado: do caminho feliz ao mais restritivo. */
const STATE_ORDER: PlaygroundState[] = [
  'success',
  'loading',
  'empty',
  'error',
  'forbidden',
];

/**
 * Patch de UM campo de texto. Explícito (e não `{ [campo]: valor }`) para o
 * compilador continuar sabendo que o alvo é um campo real da configuração.
 */
function patchTextField(
  field: PlaygroundTextField,
  value: string,
): Partial<PlaygroundConfig> {
  switch (field) {
    case 'subtitle':
      return { subtitle: value };
    case 'description':
      return { description: value };
    case 'emptyMessage':
      return { emptyMessage: value };
    default:
      return { title: value };
  }
}

export function PlaygroundWrapperPanel({
  config,
  onPatch,
  titlePlaceholder,
  isTitleRequired,
  isLive,
  data,
  badgeLabel,
}: PlaygroundWrapperPanelProps) {
  // Último campo tocado: é onde o clique numa variável insere `{{chave}}`.
  // Guardar o ÚLTIMO (e não limpar no blur) é o que faz o clique funcionar —
  // clicar no token tira o foco do campo antes do handler rodar.
  const [focusedField, setFocusedField] = useState<PlaygroundTextField>('title');

  const duration =
    typeof config.durationMs === 'number' && Number.isFinite(config.durationMs)
      ? formatDuration(config.durationMs)
      : '—';

  const insertVariable = (key: string) => {
    const current = config[focusedField];
    const separator = current.length > 0 && !current.endsWith(' ') ? ' ' : '';
    onPatch(patchTextField(focusedField, `${current}${separator}{{${key}}}`));
  };

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={4}>Cabeçalho</Heading>
        <Text type="supporting">
          O ícone e a etiqueta “{badgeLabel}” do card vêm do tipo do bloco — o que dá para
          escrever é o texto abaixo.
        </Text>
      </VStack>

      <PlaygroundHeaderFields
        config={config}
        onPatch={onPatch}
        titlePlaceholder={titlePlaceholder}
        isTitleRequired={isTitleRequired}
        onFocusField={setFocusedField}
      />

      <PlaygroundVariables
        data={data}
        onInsert={insertVariable}
        insertHint={`Um clique insere no campo “${HEADER_FIELD_LABEL[focusedField]}”.`}
      />

      <Divider />

      <VStack gap={4}>
        <Heading level={4}>Estado e rodapé</Heading>

        <Selector
          label="Pré-visualizar o bloco como"
          size="sm"
          value={config.previewState}
          description="Todo bloco cobre os cinco estados; aqui você vê cada um sem esperar a query."
          options={STATE_ORDER.map((state) => ({
            value: state,
            label: PLAYGROUND_STATE_LABEL[state],
          }))}
          onChange={(next) => onPatch({ previewState: next as PlaygroundState })}
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
    </VStack>
  );
}
