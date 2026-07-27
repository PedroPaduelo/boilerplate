/**
 * Linha de um item da paleta: ícone + rótulo + qualificador discreto.
 *
 * O qualificador (status do artefato, banco da conexão) é METADADO, não estado
 * que exija ação — por isso é texto de apoio e não um Badge, que roubaria
 * atenção em todas as linhas.
 */
import { HStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { Item } from '@astryxdesign/core/Item';
import { Text } from '@astryxdesign/core/Text';
import type { CommandAction } from './use-command-actions';

export interface CommandPaletteRowProps {
  item: CommandAction;
}

export function CommandPaletteRow({ item }: CommandPaletteRowProps) {
  const data = item.auxiliaryData;
  if (!data) return <Text type="body">{item.label}</Text>;

  return (
    <Item
      density="compact"
      label={item.label}
      labelLines={1}
      startContent={<Icon icon={data.icon} size="sm" />}
      endContent={
        data.hint ? (
          <HStack gap={1} vAlign="center">
            <Text type="supporting">{data.hint}</Text>
          </HStack>
        ) : undefined
      }
    />
  );
}
