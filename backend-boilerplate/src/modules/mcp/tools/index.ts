/**
 * Registro central das TOOLS do MCP (T-D).
 *
 * Agrega as tools de cada domínio numa única lista (a ordem é a ordem de
 * descoberta em `tools/list`) e expõe um lookup por nome. Adicionar uma tool =
 * incluí-la no array do seu domínio; nada mais precisa mudar.
 *
 * Mapa tool → service reusado (NENHUMA regra reimplementada):
 *   list_connections        → modules/connections (listConnections + rbac)
 *   get_connection_schema   → modules/connections (introspectSchema)
 *   run_query               → modules/connections (runConnectionQuery / pg-runner)
 *   list_catalog            → lib/catalog (catálogo VIVO, F0.4)
 *   create_chart            → modules/charts (createChart)
 *   update_chart            → modules/charts (updateChart)
 *   publish_chart           → modules/charts (publishChart)
 *   preview_chart_data      → modules/data (executeBlockData) + pg-runner
 *   create_dashboard        → modules/dashboards (createDashboard)
 *   update_dashboard        → modules/dashboards (updateDashboard)
 *   add_chart_to_dashboard  → modules/dashboards (addChartToDashboard)
 *   publish_dashboard       → modules/dashboards (publishDashboard)
 */
import { catalogTools } from './catalog';
import { chartTools } from './charts';
import { connectionTools } from './connections';
import { dashboardTools } from './dashboards';
import type { ToolDefinition } from './types';

/** Todas as tools expostas pelo MCP, na ordem de listagem. */
export const TOOLS: ToolDefinition[] = [
  ...connectionTools,
  ...catalogTools,
  ...chartTools,
  ...dashboardTools,
];

const toolsByName = new Map<string, ToolDefinition>(TOOLS.map((t) => [t.name, t]));

/** Busca uma tool pelo nome (ou `undefined`). */
export function getTool(name: string): ToolDefinition | undefined {
  return toolsByName.get(name);
}

/** Lista (anúncio de `tools/list`): nome + descrição + inputSchema. */
export function listToolDescriptors(): {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}[] {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

export type { ToolDefinition } from './types';
