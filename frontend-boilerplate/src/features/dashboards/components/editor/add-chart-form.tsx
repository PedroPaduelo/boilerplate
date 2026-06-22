/**
 * Form de `add_chart_to_dashboard` (T-G2) — referencia um Chart existente e o
 * insere como bloco no draftLayout via POST /dashboards/:id/blocks (o backend
 * monta o bloco e devolve o dashboard atualizado).
 *
 * Habilitado só quando NÃO há alterações não salvas (a operação aplica sobre o
 * draft do servidor; salvar antes evita perder edições locais).
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { useCharts } from '@/features/charts/hooks';
import type { AddChartInput } from '../../types';
import type { EditorRow } from '../../lib/layout-editor';

export interface AddChartFormProps {
  rows: EditorRow[];
  disabled?: boolean;
  pending?: boolean;
  onAdd: (input: AddChartInput) => void;
}

const NEW_ROW = '__new_row';

export function AddChartForm({ rows, disabled, pending, onAdd }: AddChartFormProps) {
  const { data, isLoading } = useCharts();
  const charts = data?.charts ?? [];

  const [chartId, setChartId] = useState('');
  const [rowId, setRowId] = useState<string>(NEW_ROW);
  const [span, setSpan] = useState(6);

  const submit = () => {
    if (!chartId) return;
    onAdd({
      chartId,
      span,
      ...(rowId !== NEW_ROW ? { rowId } : {}),
    });
    setChartId('');
  };

  return (
    <div data-slot="add-chart-form" className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Adicionar gráfico</h3>
      {disabled ? (
        <p className="text-xs text-muted-foreground">
          Salve o rascunho antes de adicionar um gráfico.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Gráfico</Label>
          <Select value={chartId} onValueChange={setChartId} disabled={disabled || isLoading}>
            <SelectTrigger size="sm" className="w-56" aria-label="Gráfico a adicionar">
              <SelectValue placeholder={isLoading ? 'Carregando…' : 'Escolha um gráfico'} />
            </SelectTrigger>
            <SelectContent>
              {charts.length === 0 ? (
                <SelectItem value="__none" disabled>
                  Nenhum gráfico disponível
                </SelectItem>
              ) : (
                charts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Linha</Label>
          <Select value={rowId} onValueChange={setRowId} disabled={disabled}>
            <SelectTrigger size="sm" className="w-44" aria-label="Linha de destino">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_ROW}>Nova linha (ao final)</SelectItem>
              {rows.map((r, i) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.title || `Linha ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="add-chart-span" className="text-xs">
            Largura
          </Label>
          <Input
            id="add-chart-span"
            type="number"
            min={1}
            max={12}
            className="h-8 w-20"
            value={span}
            disabled={disabled}
            onChange={(e) => setSpan(Number(e.target.value))}
          />
        </div>

        <Button
          type="button"
          size="sm"
          disabled={disabled || pending || !chartId}
          onClick={submit}
        >
          <Plus /> Adicionar
        </Button>
      </div>
    </div>
  );
}
