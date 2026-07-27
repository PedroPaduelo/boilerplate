/**
 * Barra de busca e filtros da listagem de gráficos.
 *
 * `Toolbar` (e não um cabeçalho qualquer) porque é uma faixa de CONTROLES
 * acima da tabela: ganha navegação por teclado e cascata de tamanho para os
 * campos filhos de graça.
 */
import { Search } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type {
  ArtifactFilterState,
  OwnerFilter,
  StatusFilter,
  VisibilityFilter,
} from '@/shared/lib/artifact-filters';
import { DEFAULT_ARTIFACT_FILTERS } from '@/shared/lib/artifact-filters';
import type { ChartsListDepartment } from '../use-charts-list';

export interface ChartsFiltersProps {
  filters: ArtifactFilterState;
  onChange: (next: ArtifactFilterState) => void;
  departments: ChartsListDepartment[];
  hasFilters: boolean;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'DRAFT', label: 'Rascunho' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'Toda visibilidade' },
  { value: 'PRIVATE', label: 'Privado' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'ORG', label: 'Organização' },
];

const OWNER_OPTIONS = [
  { value: 'ALL', label: 'Qualquer dono' },
  { value: 'MINE', label: 'Meus' },
];

export function ChartsFilters({
  filters,
  onChange,
  departments,
  hasFilters,
}: ChartsFiltersProps) {
  const patch = (partial: Partial<ArtifactFilterState>) =>
    onChange({ ...filters, ...partial });

  return (
    <Toolbar
      label="Busca e filtros de gráficos"
      size="sm"
      gap={2}
      startContent={
        <TextInput
          label="Buscar gráficos por título"
          isLabelHidden
          size="sm"
          width={260}
          value={filters.search}
          placeholder="Buscar gráficos por título…"
          startIcon={Search}
          hasClear
          onChange={(search) => patch({ search })}
        />
      }
      endContent={
        <HStack gap={2} wrap="wrap" vAlign="center">
          <Selector
            label="Status"
            isLabelHidden
            size="sm"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(status) => patch({ status: status as StatusFilter })}
          />
          <Selector
            label="Visibilidade"
            isLabelHidden
            size="sm"
            value={filters.visibility}
            options={VISIBILITY_OPTIONS}
            onChange={(visibility) =>
              patch({ visibility: visibility as VisibilityFilter })
            }
          />
          <Selector
            label="Departamento"
            isLabelHidden
            size="sm"
            value={filters.departmentId}
            options={[
              { value: 'ALL', label: 'Todo departamento' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            onChange={(departmentId) => patch({ departmentId })}
          />
          <Selector
            label="Dono"
            isLabelHidden
            size="sm"
            value={filters.owner}
            options={OWNER_OPTIONS}
            onChange={(owner) => patch({ owner: owner as OwnerFilter })}
          />
          {/* O rótulo diz o que ESTE controle zera (a barra inteira: busca +
              os quatro seletores). O estado vazio por filtro tem o seu próprio
              "Limpar filtros" — dois botões com o MESMO nome na mesma tela
              seriam indistinguíveis na lista de controles de um leitor de
              tela, que só anuncia o nome acessível. */}
          <Button
            label="Limpar busca e filtros"
            variant="ghost"
            size="sm"
            isDisabled={!hasFilters}
            tooltip={hasFilters ? 'Volta para a lista completa' : 'Nenhum filtro ativo'}
            onClick={() => onChange(DEFAULT_ARTIFACT_FILTERS)}
          />
        </HStack>
      }
    />
  );
}
