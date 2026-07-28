/**
 * Ajuda de VARIÁVEIS — o vocabulário de `{{interpolação}}` disponível para o
 * dado que está no preview.
 *
 * Existe porque o contrato comum promete que todo campo de texto aceita
 * Markdown e `{{variavel}}`, mas nada na tela dizia QUAIS variáveis existem —
 * quem configurava o bloco tinha que adivinhar (ou ler o `chart-template.ts`).
 *
 * A lista sai de `buildChartScope(data)`, a MESMA função que a moldura usa para
 * resolver os textos: se aparece aqui, funciona lá.
 */
import { Badge } from '@astryxdesign/core/Badge';
import { Code } from '@astryxdesign/core/Code';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { availableVariables } from './playground-scope';

export interface PlaygroundVariablesProps {
  /** Dado atual do preview — a origem do escopo. */
  data: unknown;
  /**
   * Insere `{{chave}}` no campo de texto em foco. Sem esta prop a lista é só
   * de consulta (é o caso da aba "Dados", onde não há campo para receber).
   */
  onInsert?: (key: string) => void;
  /** Diz em qual campo a inserção vai cair — some quando não há inserção. */
  insertHint?: string;
}

export function PlaygroundVariables({
  data,
  onInsert,
  insertHint,
}: PlaygroundVariablesProps) {
  const variables = availableVariables(data);

  return (
    <VStack gap={2}>
      <HStack gap={2} justify="between" vAlign="center">
        <Heading level={4}>Variáveis do dado</Heading>
        <Badge variant="neutral" label={`${variables.length}`} />
      </HStack>

      <Text type="supporting">
        Todo campo de texto do cabeçalho aceita Markdown e{' '}
        <Code size="inherit">{'{{variavel}}'}</Code>.
      </Text>

      {variables.length === 0 ? (
        <Text type="supporting">
          Nenhuma variável ainda — informe um dado na aba “Dados” para ver o vocabulário
          deste bloco.
        </Text>
      ) : (
        <>
          <HStack gap={1.5} wrap="wrap">
            {variables.map(({ key, preview }) => (
              <Token
                key={key}
                size="sm"
                color={onInsert ? 'blue' : 'gray'}
                label={`{{${key}}}`}
                description={
                  onInsert
                    ? `Inserir {{${key}}} — valor atual: ${preview}`
                    : `Valor atual: ${preview}`
                }
                onClick={onInsert ? () => onInsert(key) : undefined}
              />
            ))}
          </HStack>
          <Text type="supporting">
            {insertHint ? `${insertHint} ` : ''}Caminhos e formatos também valem:{' '}
            <Code size="inherit">{'{{dados.0.valor}}'}</Code>,{' '}
            <Code size="inherit">{'{{total|compactBRL}}'}</Code>.
          </Text>
        </>
      )}
    </VStack>
  );
}
