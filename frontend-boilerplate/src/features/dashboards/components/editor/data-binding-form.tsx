/**
 * Form ENXUTO de `dataBinding` de um bloco (T-G2). Sem query-builder visual:
 * connectionId + textarea de SQL + params (filterId→alias) + transform + ttl.
 *
 * O contrato (doc 20) exige `connectionId` e `query`; cada param exige `filterId`
 * e `as`. Campos vazios são mantidos para que a validação do contrato (no salvar)
 * aponte o problema. `ttlSeconds = 0` = bloco tempo-real (sem cache no T-C).
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
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorBindingParam, EditorDataBinding } from '../../lib/layout-editor';
import { Textarea } from './textarea';

export interface DataBindingFormProps {
  blockId: string;
  binding: EditorDataBinding | undefined;
  filters: DashFilter[];
  onChange: (binding: EditorDataBinding | undefined) => void;
}

export function DataBindingForm({ blockId, binding, filters, onChange }: DataBindingFormProps) {
  if (!binding) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ connectionId: '', query: '' })}
      >
        <Plus /> Adicionar fonte de dados
      </Button>
    );
  }

  const patch = (p: Partial<EditorDataBinding>) => onChange({ ...binding, ...p });
  const params = binding.params ?? [];

  const setParam = (idx: number, p: Partial<EditorBindingParam>) => {
    const next = params.map((it, i) => (i === idx ? { ...it, ...p } : it));
    patch({ params: next });
  };
  const addParam = () =>
    patch({ params: [...params, { filterId: filters[0]?.id ?? '', as: '' }] });
  const removeParam = (idx: number) =>
    patch({ params: params.filter((_, i) => i !== idx) });

  return (
    <div data-slot="data-binding-form" className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`binding-conn-${blockId}`} className="text-xs">
          Conexão (connectionId)
        </Label>
        <Input
          id={`binding-conn-${blockId}`}
          className="h-9"
          placeholder="conn_xxxxx"
          value={binding.connectionId}
          onChange={(e) => patch({ connectionId: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`binding-query-${blockId}`} className="text-xs">
          Consulta SQL (somente leitura)
        </Label>
        <Textarea
          id={`binding-query-${blockId}`}
          className="font-mono text-xs"
          rows={4}
          placeholder="SELECT ..."
          value={binding.query}
          onChange={(e) => patch({ query: e.target.value })}
        />
      </div>

      {/* params: filterId → alias usado na query */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Parâmetros (filtro → alias)</Label>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={addParam}>
            <Plus /> Param
          </Button>
        </div>
        {params.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem parâmetros.</p>
        ) : (
          params.map((p, idx) => (
            <div key={idx} data-slot="binding-param" className="flex items-center gap-2">
              <Select value={p.filterId} onValueChange={(v) => setParam(idx, { filterId: v })}>
                <SelectTrigger size="sm" className="w-40" aria-label={`Filtro do parâmetro ${idx + 1}`}>
                  <SelectValue placeholder="filtro" />
                </SelectTrigger>
                <SelectContent>
                  {filters.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Nenhum filtro
                    </SelectItem>
                  ) : (
                    filters.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label || f.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                className="h-9 w-32"
                placeholder="alias (as)"
                aria-label={`Alias do parâmetro ${idx + 1}`}
                value={p.as}
                onChange={(e) => setParam(idx, { as: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label={`Remover parâmetro ${idx + 1}`}
                onClick={() => removeParam(idx)}
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`binding-transform-${blockId}`} className="text-xs">
            Transform (opcional)
          </Label>
          <Input
            id={`binding-transform-${blockId}`}
            className="h-9 w-44"
            placeholder="ex.: scalar"
            value={typeof binding.transform === 'string' ? binding.transform : ''}
            onChange={(e) => patch({ transform: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`binding-ttl-${blockId}`} className="text-xs">
            TTL (segundos)
          </Label>
          <Input
            id={`binding-ttl-${blockId}`}
            type="number"
            min={0}
            className="h-9 w-32"
            placeholder="3600"
            value={binding.ttlSeconds ?? ''}
            onChange={(e) =>
              patch({ ttlSeconds: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => onChange(undefined)}
        >
          <Trash2 /> Remover fonte de dados
        </Button>
      </div>
    </div>
  );
}
