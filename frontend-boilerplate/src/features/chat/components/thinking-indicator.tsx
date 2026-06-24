/**
 * Indicador de "pensando" — bolha do assistant com animação contextual.
 * Se toolSteps existirem, mostra qual ferramenta está usando.
 */
import { Bot, Loader2, Database, Search, FileChartColumn, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TOOL_ICONS: Record<string, LucideIcon> = {
  list_connections: Database,
  get_connection_schema: Search,
  run_query: Database,
  list_catalog: FileChartColumn,
  create_chart: Sparkles,
};

const TOOL_LABELS: Record<string, string> = {
  list_connections: 'Buscando conexões',
  get_connection_schema: 'Analisando tabelas',
  run_query: 'Executando query',
  list_catalog: 'Consultando catálogo',
  create_chart: 'Criando gráfico',
};

export interface ThinkingBubbleProps {
  toolSteps?: Array<{ toolName: string; phase: 'call' | 'result' }>;

  /** Manter compatibilidade com o indicador antigo (sem props). */
  'data-slot'?: string;
  role?: string;
  'aria-label'?: string;
}

export function ThinkingIndicator() {
  return (
    <div
      data-slot="chat-thinking"
      role="status"
      aria-label="O agente está digitando"
      className="flex items-center gap-1 px-1 py-2"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function ThinkingBubble({ toolSteps = [] }: ThinkingBubbleProps) {
  // Encontra a última tool em fase de call (ainda executando)
  const activeTool = [...toolSteps].reverse().find((s) => s.phase === 'call');
  const ToolIcon = activeTool ? (TOOL_ICONS[activeTool.toolName] ?? Loader2) : null;
  const label = activeTool ? (TOOL_LABELS[activeTool.toolName] ?? activeTool.toolName) : null;

  return (
    <div className="flex animate-in fade-in slide-in-from-bottom-2 duration-300 gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
        <Bot className="size-4" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
          {ToolIcon && label ? (
            <>
              <ToolIcon className="size-4 animate-pulse text-primary" />
              <span className="text-sm text-muted-foreground">{label}...</span>
            </>
          ) : (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
