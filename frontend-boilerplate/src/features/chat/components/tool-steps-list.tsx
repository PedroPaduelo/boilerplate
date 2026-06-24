/**
 * Lista de tool steps — mostra as ferramentas que o agente está usando
 * com animação de entrada e ícones contextuais por ferramenta.
 */
import {
  CheckCircle2, Loader2,
  Database, Search, FileChartColumn, Sparkles,
  LayoutDashboard, FileEdit, FileCheck2, FilePlus2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ToolStep {
  toolName: string;
  phase: 'call' | 'result';
  args?: unknown;
  output?: unknown;
}

const TOOL_META: Record<string, { icon: LucideIcon; label: string }> = {
  list_connections:        { icon: Database,          label: 'Buscando conexões' },
  get_connection_schema:   { icon: Search,            label: 'Analisando tabelas' },
  run_query:               { icon: Database,          label: 'Executando query' },
  list_catalog:            { icon: FileChartColumn,   label: 'Consultando catálogo' },
  create_chart:            { icon: Sparkles,          label: 'Criando gráfico' },
  update_chart:            { icon: FileEdit,          label: 'Editando gráfico' },
  publish_chart:           { icon: FileCheck2,        label: 'Publicando gráfico' },
  preview_chart_data:      { icon: FileChartColumn,   label: 'Pré-visualizando dados' },
  create_dashboard:        { icon: LayoutDashboard,   label: 'Criando dashboard' },
  update_dashboard:        { icon: FileEdit,          label: 'Editando dashboard' },
  add_chart_to_dashboard:  { icon: FilePlus2,         label: 'Adicionando ao dashboard' },
  publish_dashboard:       { icon: FileCheck2,        label: 'Publicando dashboard' },
  activate_skill:          { icon: Sparkles,          label: 'Ativando skill' },
};

export function ToolStepsList({ steps }: { steps: ToolStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      {steps.map((step, idx) => {
        const meta = TOOL_META[step.toolName];
        const label = meta?.label ?? step.toolName;
        const isDone = step.phase === 'result';

        return (
          <div
            key={idx}
            className={cn(
              'flex animate-in fade-in slide-in-from-left-2 duration-300 items-center gap-2 rounded-lg px-3 py-1.5 text-xs',
              isDone
                ? 'bg-green-500/5 text-green-600 dark:text-green-400'
                : 'bg-primary/5 text-primary',
            )}
          >
            {isDone ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
            ) : (
              <Loader2 className="size-3.5 shrink-0 animate-spin" />
            )}
            <span className="font-medium">{label}</span>
            {isDone ? <span className="text-[10px] opacity-60">concluído</span> : null}
          </div>
        );
      })}
    </div>
  );
}
