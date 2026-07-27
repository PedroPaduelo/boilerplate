/**
 * FilterBar — controles INTERATIVOS no topo da tela de dashboard.
 *
 * Renderizada a partir de `layout.filters` (contrato de LAYOUT, doc 20). Mantém
 * o estado dos valores no componente pai (controlado): cada mudança chama
 * `onChange(filterId, value)` e o pai recompõe o objeto de filtros → novo
 * `filtersHash` → re-dispara o batch (`useDashboardData`). O backend recomputa
 * SÓ os blocos que escutam aquele filtro (cacheKey por bloco do T-C).
 *
 * É uma `Toolbar` (ações contextuais sobre o conteúdo abaixo), não um header de
 * página: o `size` cascateia para os campos e o divisor a separa do grid.
 */
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/Layout';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { DashFilter, FilterValues } from '../lib/dashboard-filters';
import { FilterControl } from './filter-control';

export interface FilterBarProps {
  filters: DashFilter[];
  values: FilterValues;
  onChange: (filterId: string, value: unknown) => void;
  onReset?: () => void;
  /** Desabilita os controles (ex.: enquanto o layout carrega). */
  isDisabled?: boolean;
}

export function FilterBar({
  filters,
  values,
  onChange,
  onReset,
  isDisabled,
}: FilterBarProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <Toolbar
      label="Filtros do dashboard"
      size="sm"
      gap={3}
      variant="muted"
      startContent={
        <HStack gap={3} wrap="wrap" vAlign="end">
          {filters.map((filter) => (
            <FilterControl
              key={filter.id}
              filter={filter}
              value={values[filter.id]}
              onChange={onChange}
              isDisabled={isDisabled}
              disabledMessage={
                isDisabled ? 'Aguarde o carregamento do dashboard.' : undefined
              }
            />
          ))}
        </HStack>
      }
      endContent={
        onReset ? (
          <Button label="Limpar filtros" isDisabled={isDisabled} onClick={onReset} />
        ) : undefined
      }
    />
  );
}
