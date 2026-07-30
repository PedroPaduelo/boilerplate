/**
 * Barra de busca/filtros da listagem de dashboards.
 *
 * `Toolbar` do Astryx: a busca e os filtros ficam no slot inicial, a ação
 * primária ("Novo dashboard") no final. O `size` é definido UMA vez na toolbar
 * e cascateia para inputs/botões — por isso nenhum filho declara tamanho.
 *
 * Componente 100% controlado: todo o estado de filtro vive na página.
 */
import { Link2, Plus, Search } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
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

export interface DashboardsToolbarProps {
  filters: ArtifactFilterState;
  onFiltersChange: (next: ArtifactFilterState) => void;
  departments: { id: string; name: string }[];
  /** `false` → o botão de criar aparece desabilitado com o motivo no tooltip. */
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
  /** Abre o cadastro de um relatório mantido FORA da plataforma (legado). */
  onRegisterExternal: () => void;
}

export function DashboardsToolbar({
  filters,
  onFiltersChange,
  departments,
  canCreate,
  isCreating,
  onCreate,
  onRegisterExternal,
}: DashboardsToolbarProps) {
  const patch = (partial: Partial<ArtifactFilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  return (
    <Toolbar
      label="Busca e filtros de dashboards"
      size="sm"
      gap={2}
      dividers={['bottom']}
      startContent={
        <HStack gap={2} wrap="wrap" vAlign="center">
          <TextInput
            label="Buscar por título"
            isLabelHidden
            placeholder="Buscar dashboards por título…"
            value={filters.search}
            startIcon={<Icon icon={Search} />}
            hasClear
            width={260}
            onChange={(value) => patch({ search: value })}
          />
          <Selector
            label="Status"
            isLabelHidden
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(value) => patch({ status: value as StatusFilter })}
          />
          <Selector
            label="Visibilidade"
            isLabelHidden
            value={filters.visibility}
            options={VISIBILITY_OPTIONS}
            onChange={(value) => patch({ visibility: value as VisibilityFilter })}
          />
          <Selector
            label="Departamento"
            isLabelHidden
            value={filters.departmentId}
            options={[
              { value: 'ALL', label: 'Todo departamento' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            onChange={(value) => patch({ departmentId: value })}
          />
          <Selector
            label="Dono"
            isLabelHidden
            value={filters.owner}
            options={OWNER_OPTIONS}
            onChange={(value) => patch({ owner: value as OwnerFilter })}
          />
        </HStack>
      }
      endContent={
        <HStack gap={2} vAlign="center">
          {/*
            Cadastrar legado é ação SECUNDÁRIA e permanente: acontece uma vez por
            relatório antigo, enquanto criar dashboard é o trabalho do dia a dia.
            Fica ao lado (e não escondido num menu) porque a migração de um
            acervo inteiro passa por aqui — e escondido ninguém acha.
          */}
          <Button
            label="Relatório externo"
            icon={<Icon icon={Link2} />}
            isDisabled={!canCreate}
            tooltip={
              canCreate
                ? 'Cadastra um relatório mantido fora da plataforma; ele aparece nesta lista e abre no endereço original.'
                : 'Seu perfil não permite cadastrar relatórios.'
            }
            onClick={onRegisterExternal}
          />
          <Button
            label="Novo dashboard"
            variant="primary"
            icon={<Icon icon={Plus} />}
            isLoading={isCreating}
            isDisabled={!canCreate}
            tooltip={canCreate ? undefined : 'Seu perfil não permite criar dashboards.'}
            onClick={onCreate}
          />
        </HStack>
      }
    />
  );
}
