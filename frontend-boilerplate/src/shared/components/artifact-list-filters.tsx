import { Search } from 'lucide-react';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import type { SelectorOptionData } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import type {
  ArtifactFilterState,
  OwnerFilter,
  StatusFilter,
  VisibilityFilter,
} from '@/shared/lib/artifact-filters';

export interface ArtifactListDepartment {
  id: string;
  name: string;
}

export interface ArtifactListFiltersProps {
  filters: ArtifactFilterState;
  onFiltersChange: (next: ArtifactFilterState) => void;
  departments: ArtifactListDepartment[];
  searchPlaceholder: string;
  /** Filtros ficam inertes enquanto a lista falha ao carregar. */
  isDisabled?: boolean;
}

const STATUS_OPTIONS: SelectorOptionData[] = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'DRAFT', label: 'Rascunho' },
];

const VISIBILITY_OPTIONS: SelectorOptionData[] = [
  { value: 'ALL', label: 'Toda visibilidade' },
  { value: 'PRIVATE', label: 'Privado' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'ORG', label: 'Organização' },
];

const OWNER_OPTIONS: SelectorOptionData[] = [
  { value: 'ALL', label: 'Qualquer dono' },
  { value: 'MINE', label: 'Meus' },
];

/**
 * Barra de busca + filtros da listagem. Controlada: todo o estado vive na
 * feature, aqui só descrevemos os controles.
 *
 * Os rótulos são ocultos VISUALMENTE (`isLabelHidden`), não removidos — cada
 * `Selector` continua tendo nome acessível ("Status", "Visibilidade"…), que é
 * o que um leitor de tela anuncia e o que os testes consultam.
 */
export function ArtifactListFilters({
  filters,
  onFiltersChange,
  departments,
  searchPlaceholder,
  isDisabled = false,
}: ArtifactListFiltersProps) {
  const patch = (partial: Partial<ArtifactFilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  const departmentOptions: SelectorOptionData[] = [
    { value: 'ALL', label: 'Todo departamento' },
    ...departments.map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  return (
    <HStack gap={2} vAlign="center" wrap="wrap">
      <StackItem size="fill">
        <TextInput
          label="Buscar por título"
          isLabelHidden
          placeholder={searchPlaceholder}
          startIcon={<Search />}
          value={filters.search}
          onChange={(value) => patch({ search: value })}
          isDisabled={isDisabled}
          disabledMessage="Indisponível enquanto a lista não carrega"
          hasClear
          width="100%"
        />
      </StackItem>

      <Selector
        label="Status"
        isLabelHidden
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(value) => patch({ status: value as StatusFilter })}
        size="sm"
        isDisabled={isDisabled}
      />

      <Selector
        label="Visibilidade"
        isLabelHidden
        options={VISIBILITY_OPTIONS}
        value={filters.visibility}
        onChange={(value) => patch({ visibility: value as VisibilityFilter })}
        size="sm"
        isDisabled={isDisabled}
      />

      <Selector
        label="Departamento"
        isLabelHidden
        options={departmentOptions}
        value={filters.departmentId}
        onChange={(value) => patch({ departmentId: value })}
        size="sm"
        isDisabled={isDisabled}
      />

      <Selector
        label="Dono"
        isLabelHidden
        options={OWNER_OPTIONS}
        value={filters.owner}
        onChange={(value) => patch({ owner: value as OwnerFilter })}
        size="sm"
        isDisabled={isDisabled}
      />
    </HStack>
  );
}
