/**
 * Editor de FILTROS do dashboard (T-G2) — adicionar/remover/editar
 * (id, label, type, default). Os tipos são o enum do contrato de LAYOUT (doc 20).
 */
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DashFilter, DashFilterType } from '../../lib/dashboard-filters';

const FILTER_TYPES: DashFilterType[] = [
  'date_range',
  'select',
  'multiselect',
  'search',
  'number_range',
];

export interface FiltersEditorProps {
  filters: DashFilter[];
  onAdd: () => void;
  onRemove: (filterId: string) => void;
  onUpdate: (filterId: string, patch: Partial<DashFilter>) => void;
}

export function FiltersEditor({ filters, onAdd, onRemove, onUpdate }: FiltersEditorProps) {
  return (
    <div data-slot="filters-editor" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Filtro
        </Button>
      </div>

      {filters.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum filtro neste dashboard.</p>
      ) : (
        filters.map((f) => (
          <div
            key={f.id}
            data-slot="filter-editor"
            data-filter-id={f.id}
            className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/20 p-2"
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor={`f-label-${f.id}`} className="text-xs">
                Rótulo
              </Label>
              <Input
                id={`f-label-${f.id}`}
                className="h-8 w-40"
                value={f.label}
                onChange={(e) => onUpdate(f.id, { label: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`f-id-${f.id}`} className="text-xs">
                id
              </Label>
              <Input
                id={`f-id-${f.id}`}
                className="h-8 w-36 font-mono text-xs"
                value={f.id}
                onChange={(e) => onUpdate(f.id, { id: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={f.type}
                onValueChange={(v) => onUpdate(f.id, { type: v as DashFilterType })}
              >
                <SelectTrigger size="sm" className="w-36" aria-label={`Tipo do filtro ${f.label || f.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`f-default-${f.id}`} className="text-xs">
                Padrão
              </Label>
              <Input
                id={`f-default-${f.id}`}
                className="h-8 w-36"
                value={typeof f.default === 'string' ? f.default : ''}
                placeholder="(opcional)"
                onChange={(e) =>
                  onUpdate(f.id, {
                    default: e.target.value === '' ? undefined : e.target.value,
                  })
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label={`Remover filtro ${f.label || f.id}`}
              onClick={() => onRemove(f.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
