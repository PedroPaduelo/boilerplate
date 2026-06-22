/**
 * Manifesto do bloco de EXEMPLO (placeholder) — prova o pipeline plug-and-play
 * da F0.4 ponta a ponta (auto-registro no FE + coleta no `build:catalog` do BE).
 *
 * PURO (sem React): é exatamente este objeto que o script `build:catalog` varre
 * para gerar `catalog.manifests.json` (consumido por BE e IA). Alinhado ao
 * BlockManifest neutro de `@dashboards/contracts` (fonte da verdade).
 *
 * T-I implementa os 7 blocos da base (kpi/bar_chart/line_chart/donut/table/
 * title/rich_text) criando pastas irmãs — sem tocar neste arquivo.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: '__example',
  kind: 'title',
  name: 'Bloco de exemplo',
  description:
    'Placeholder que valida o auto-registro do catálogo (F0.4). Não use em produção.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      label: { type: 'string' },
    },
  },
  defaultProps: { label: 'Auto-registrado ✔' },
  version: '0.0.0',
} satisfies BlockManifest;
