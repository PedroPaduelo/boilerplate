/**
 * Aba "Propriedades" — todas as props visuais do bloco, geradas do
 * `propsSchema`, em duas colunas quando há espaço.
 *
 * A ação de restaurar o padrão fica na barra do painel
 * (`PlaygroundToolbar`), para não repetir o mesmo comando em dois lugares.
 */
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { PropFieldEditor } from './prop-field-editor';
import type { PropField } from './types';

export interface PlaygroundPropsPanelProps {
  fields: PropField[];
  values: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
}

export function PlaygroundPropsPanel({
  fields,
  values,
  onPropChange,
}: PlaygroundPropsPanelProps) {
  if (fields.length === 0) {
    return (
      <VStack gap={3}>
        <Heading level={4}>Propriedades visuais</Heading>
        <Text type="supporting">
          Este bloco não expõe props configuráveis — o que ele mostra vem só dos dados.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={3}>
      <Heading level={4}>Propriedades visuais ({fields.length})</Heading>
      <Grid columns={{ minWidth: 200, max: 2 }} gap={3}>
        {fields.map((field) => (
          <PropFieldEditor
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(next) => onPropChange(field.key, next)}
          />
        ))}
      </Grid>
    </VStack>
  );
}
