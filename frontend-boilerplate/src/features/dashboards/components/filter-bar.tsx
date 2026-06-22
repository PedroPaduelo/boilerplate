/**
 * FilterBar (T-G1) — controles INTERATIVOS no topo da tela de dashboard.
 *
 * Renderizada a partir de `layout.filters` (contrato de LAYOUT, doc 20). Mantém
 * o estado dos valores no componente pai (controlado): cada mudança chama
 * `onChange(filterId, value)` e o pai recompõe o objeto de filtros → novo
 * `filtersHash` → re-dispara o batch (`useDashboardData`). O backend recomputa
 * SÓ os blocos que escutam aquele filtro (cacheKey por bloco do T-C).
 *
 * O catálogo de filtros do contrato traz apenas { id, type, label, default } —
 * não há lista de opções para `select`/`multiselect`, então usamos um campo de
 * texto livre nesses casos (MVP). Tipos `date_range` e `number_range` usam dois
 * campos (from/to, min/max).
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { DashFilter, FilterValues } from '../lib/dashboard-filters';

export interface FilterBarProps {
  filters: DashFilter[];
  values: FilterValues;
  onChange: (filterId: string, value: unknown) => void;
  onReset?: () => void;
  /** Desabilita os controles (ex.: enquanto o layout carrega). */
  disabled?: boolean;
}

function asRange(value: unknown): { from?: string; to?: string } {
  if (value && typeof value === 'object') return value as { from?: string; to?: string };
  return {};
}
function asNumberRange(value: unknown): { min?: number; max?: number } {
  if (value && typeof value === 'object') return value as { min?: number; max?: number };
  return {};
}

export function FilterBar({
  filters,
  values,
  onChange,
  onReset,
  disabled,
}: FilterBarProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <div
      data-slot="filter-bar"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      {filters.map((f) => (
        <div key={f.id} data-slot="filter-control" data-filter-id={f.id} className="flex flex-col gap-1">
          <Label htmlFor={`filter-${f.id}`} className="text-xs text-muted-foreground">
            {f.label}
          </Label>

          {f.type === 'date_range' || f.type === 'number_range' ? (
            <RangeControl filter={f} value={values[f.id]} onChange={onChange} disabled={disabled} />
          ) : (
            <Input
              id={`filter-${f.id}`}
              type={f.type === 'search' ? 'search' : 'text'}
              className="h-9 w-44"
              placeholder={f.label}
              value={typeof values[f.id] === 'string' ? (values[f.id] as string) : ''}
              disabled={disabled}
              onChange={(e) => onChange(f.id, e.target.value)}
            />
          )}
        </div>
      ))}

      {onReset ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={onReset}
          disabled={disabled}
        >
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}

function RangeControl({
  filter,
  value,
  onChange,
  disabled,
}: {
  filter: DashFilter;
  value: unknown;
  onChange: (filterId: string, value: unknown) => void;
  disabled?: boolean;
}) {
  if (filter.type === 'number_range') {
    const r = asNumberRange(value);
    return (
      <div className="flex items-center gap-1">
        <Input
          id={`filter-${filter.id}`}
          type="number"
          aria-label={`${filter.label} mínimo`}
          className="h-9 w-24"
          placeholder="mín"
          value={r.min ?? ''}
          disabled={disabled}
          onChange={(e) =>
            onChange(filter.id, { ...r, min: e.target.value === '' ? undefined : Number(e.target.value) })
          }
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          aria-label={`${filter.label} máximo`}
          className="h-9 w-24"
          placeholder="máx"
          value={r.max ?? ''}
          disabled={disabled}
          onChange={(e) =>
            onChange(filter.id, { ...r, max: e.target.value === '' ? undefined : Number(e.target.value) })
          }
        />
      </div>
    );
  }

  const r = asRange(value);
  return (
    <div className="flex items-center gap-1">
      <Input
        id={`filter-${filter.id}`}
        type="date"
        aria-label={`${filter.label} de`}
        className="h-9 w-36"
        value={r.from ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(filter.id, { ...r, from: e.target.value })}
      />
      <span className="text-muted-foreground">—</span>
      <Input
        type="date"
        aria-label={`${filter.label} até`}
        className="h-9 w-36"
        value={r.to ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(filter.id, { ...r, to: e.target.value })}
      />
    </div>
  );
}
