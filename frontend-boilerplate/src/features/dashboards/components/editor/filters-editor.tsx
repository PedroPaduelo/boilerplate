/**
 * Editor de FILTROS do dashboard — adicionar/remover/editar (id, label, type,
 * default). Os tipos são o enum do contrato de LAYOUT (doc 20).
 *
 * A lista inteira é UMA região (`Section`), não um card por filtro: filtro é
 * campo de configuração, não item discreto — uma borda por linha viraria ruído.
 *
 * A `key` é o índice, e não `filter.id`: o id é editável, e usá-lo como key
 * remontaria o campo a cada tecla digitada (o foco saltaria para fora). Filtros
 * não são reordenáveis, então o índice é estável o bastante.
 */
import { Plus } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import type { DashFilter } from '../../lib/dashboard-filters';
import { FilterEditorRow } from './filter-editor-row';

export interface FiltersEditorProps {
  filters: DashFilter[];
  onAdd: () => void;
  onRemove: (filterId: string) => void;
  onUpdate: (filterId: string, patch: Partial<DashFilter>) => void;
}

export function FiltersEditor({
  filters,
  onAdd,
  onRemove,
  onUpdate,
}: FiltersEditorProps) {
  const addButton = (
    <Button
      label="Adicionar filtro"
      icon={<Icon icon={Plus} />}
      size="sm"
      onClick={onAdd}
    />
  );

  return (
    <VStack gap={3}>
      <HStack vAlign="center" hAlign="between" gap={2}>
        <Text type="label">Filtros</Text>
        {addButton}
      </HStack>

      {filters.length === 0 ? (
        <EmptyState
          isCompact
          headingLevel={4}
          title="Nenhum filtro neste dashboard"
          description="Filtros aparecem no topo do dashboard e alimentam os parâmetros das consultas dos blocos."
          actions={addButton}
        />
      ) : (
        <Section variant="muted" padding={3} aria-label="Filtros do dashboard">
          <VStack gap={3}>
            {filters.map((filter, index) => (
              <FilterEditorRow
                key={index}
                filter={filter}
                index={index}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))}
          </VStack>
        </Section>
      )}
    </VStack>
  );
}
