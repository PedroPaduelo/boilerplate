/**
 * Lista de tool steps — mostra as ferramentas que o agente está usando
 * (list_connections, run_query, create_chart, etc.) em tempo real.
 */

import { Wrench, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ToolStep {
  toolName: string;
  phase: 'call' | 'result';
  args?: unknown;
  output?: unknown;
}

const TOOL_LABELS: Record<string, string> = {
  list_connections: 'Listando conexões',
  get_connection_schema: 'Introspectando schema',
  run_query: 'Executando query',
  list_catalog: 'Consultando catálogo',
  create_chart: 'Criando gráfico',
  update_chart: 'Atualizando gráfico',
  publish_chart: 'Publicando gráfico',
  preview_chart_data: 'Pré-visualizando dados',
  create_dashboard: 'Criando dashboard',
  update_dashboard: 'Atualizando dashboard',
  add_chart_to_dashboard: 'Adicionando ao dashboard',
  publish_dashboard: 'Publicando dashboard',
  activate_skill: 'Ativando skill',
};

export function ToolStepsList({ steps }: { steps: ToolStep[] }) {
  if (steps.length === 0) return null;

  // Agrupa por toolName + mostra o último estado
  const grouped = new Map<string, ToolStep>();
  for (const step of steps) {
    const key = `${step.toolName}-${steps.indexOf(step)}`;
    grouped.set(key, step);
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Wrench className="size-3" />
        Ferramentas do agente
      </div>
      {steps.map((step, idx) => {
        const label = TOOL_LABELS[step.toolName] ?? step.toolName;
        const isDone = step.phase === 'result';
        return (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            {isDone ? (
              <CheckCircle2 className="size-3 text-green-500" />
            ) : (
              <Loader2 className="size-3 animate-spin" />
            )}
            <span className={cn(isDone && 'line-through opacity-60')}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
