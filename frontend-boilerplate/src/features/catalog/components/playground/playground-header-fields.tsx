/**
 * Os quatro campos de TEXTO do cabeçalho do bloco — título, subtítulo,
 * descrição e mensagem de estado vazio.
 *
 * Ficam num arquivo próprio porque são o contrato comum (`PLANO.md` §4): valem
 * para TODO bloco do catálogo, do gráfico ao narrativo, e todos passam pelo
 * mesmo tratamento (Markdown + `{{variavel}}`) na moldura.
 *
 * Cada campo avisa em `onFocus` qual é — é assim que um clique na ajuda de
 * variáveis sabe onde inserir `{{chave}}` sem precisar mexer no DOM.
 */
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/Layout';
import { HEADER_FIELD_LABEL } from './playground-helpers';
import type { PlaygroundConfig, PlaygroundTextField } from './types';

export interface PlaygroundHeaderFieldsProps {
  config: PlaygroundConfig;
  onPatch: (partial: Partial<PlaygroundConfig>) => void;
  /** Placeholder do título quando vazio (nome do bloco). */
  titlePlaceholder: string;
  /** Em `/charts/:id` o título é persistido — vazio vira erro inline. */
  isTitleRequired: boolean;
  /** Registra o campo em foco (destino da inserção de variáveis). */
  onFocusField: (field: PlaygroundTextField) => void;
}

export function PlaygroundHeaderFields({
  config,
  onPatch,
  titlePlaceholder,
  isTitleRequired,
  onFocusField,
}: PlaygroundHeaderFieldsProps) {
  const titleError = isTitleRequired && config.title.trim().length === 0;

  return (
    <VStack gap={4}>
      <TextInput
        label={HEADER_FIELD_LABEL.title}
        size="sm"
        value={config.title}
        placeholder={titlePlaceholder}
        isRequired={isTitleRequired}
        description="Aceita Markdown e {{variavel}}."
        status={titleError ? { type: 'error', message: 'Informe um título.' } : undefined}
        onFocus={() => onFocusField('title')}
        onChange={(title) => onPatch({ title })}
      />

      <TextInput
        label={HEADER_FIELD_LABEL.subtitle}
        size="sm"
        value={config.subtitle}
        placeholder="(vazio)"
        isOptional
        description="Linha de apoio abaixo do título. Aceita Markdown e {{variavel}}."
        onFocus={() => onFocusField('subtitle')}
        onChange={(subtitle) => onPatch({ subtitle })}
      />

      <TextArea
        label={HEADER_FIELD_LABEL.description}
        size="sm"
        rows={2}
        value={config.description}
        placeholder="O que este bloco responde, em uma frase."
        isOptional
        hasSpellCheck={false}
        description="Ajuda do cabeçalho: explica o bloco para quem lê o painel. Aceita Markdown e {{variavel}}."
        onFocus={() => onFocusField('description')}
        onChange={(description) => onPatch({ description })}
      />

      <TextArea
        label={HEADER_FIELD_LABEL.emptyMessage}
        size="sm"
        rows={2}
        value={config.emptyMessage}
        placeholder="Ex.: Nenhum lançamento no período."
        isOptional
        hasSpellCheck={false}
        description="Substitui o “Sem dados” padrão quando a consulta não traz linhas. Aceita Markdown e {{variavel}}."
        onFocus={() => onFocusField('emptyMessage')}
        onChange={(emptyMessage) => onPatch({ emptyMessage })}
      />
    </VStack>
  );
}
