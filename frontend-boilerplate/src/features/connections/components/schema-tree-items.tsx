import { Layers, Table2 } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import type { TreeListItemData } from '@astryxdesign/core/TreeList';
import type { SchemaDef, TableRef } from './db-schema-explorer-types';

/**
 * Monta os itens do `TreeList` a partir dos schemas já filtrados.
 *
 * Cada tabela tem `onClick`: o `TreeList` transforma isso num botão real
 * dentro da linha, que é o que faz Enter/Espaço funcionarem pelo teclado (as
 * setas e o chevron são do próprio componente). Sem `onClick` a linha viraria
 * texto morto para quem navega sem mouse.
 */
export interface SchemaTreeOptions {
  schemas: SchemaDef[];
  selected: TableRef | null;
  /** Estado de expansão semeado para os nós de schema. */
  isExpanded: boolean;
  onSelect: (ref: TableRef) => void;
}

export function buildSchemaTreeItems({
  schemas,
  selected,
  isExpanded,
  onSelect,
}: SchemaTreeOptions): TreeListItemData[] {
  return schemas.map((schema) => ({
    id: `schema:${schema.name}`,
    label: (
      <Text type="code" maxLines={1}>
        {schema.name}
      </Text>
    ),
    startContent: <Icon icon={Layers} size="xsm" color="secondary" />,
    endContent: (
      <Text type="supporting" color="secondary" hasTabularNumbers>
        {schema.tables.length}
        {schema.views ? ` · ${schema.views} views` : ''}
      </Text>
    ),
    isExpanded,
    children: schema.tables.map((table) => ({
      id: `table:${schema.name}.${table.name}`,
      label: (
        <Text type="code" maxLines={1}>
          {table.name}
        </Text>
      ),
      startContent: (
        <Icon
          icon={Table2}
          size="xsm"
          color={table.foreignKeys.length > 0 ? 'accent' : 'secondary'}
        />
      ),
      endContent:
        table.foreignKeys.length > 0 ? (
          <Badge variant="neutral" label={`${table.foreignKeys.length} FK`} />
        ) : (
          <Text type="supporting" color="secondary" hasTabularNumbers>
            {table.columns.length}c
          </Text>
        ),
      isSelected: selected?.schema === schema.name && selected?.table === table.name,
      onClick: () => onSelect({ schema: schema.name, table: table.name }),
    })),
  }));
}
