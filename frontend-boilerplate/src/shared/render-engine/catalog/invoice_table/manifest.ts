/**
 * Manifesto do bloco `invoice_table` (shape 'table') — tabela de itens estilo
 * fatura (descrição × quantidade × valor unitário) com total. Usa o Vitrine
 * `InvoiceTable`. Espera linhas com as colunas `label`, `qty` e `unit`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'invoice_table',
  kind: 'chart',
  name: 'Tabela de Fatura',
  description: 'Itens com quantidade × valor unitário e total no rodapé. Linhas: label, qty, unit.',
  source: 'vitrine:invoice-table',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { currency: { type: 'string' } },
  },
  dataContract: {
    shape: 'table',
    spec: {
      columns: { type: 'array', required: true },
      rows: { type: 'array', required: true },
    },
    example: {
      columns: [
        { key: 'label', label: 'Item', type: 'string' },
        { key: 'qty', label: 'Qtd.', type: 'number' },
        { key: 'unit', label: 'Valor', type: 'number' },
      ],
      rows: [{ label: 'Licença', qty: 3, unit: 1200 }],
    },
  },
  defaultProps: { currency: 'BRL' },
  maxRows: 1000,
  version: '1.0.0',
} satisfies BlockManifest;
