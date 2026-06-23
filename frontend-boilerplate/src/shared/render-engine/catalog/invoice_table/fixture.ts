/** Fixture do bloco `invoice_table` — casa com o dataContract (shape 'table'). */
import type { TableData } from '@dashboards/contracts';

export const fixture: TableData = {
  columns: [
    { key: 'label', label: 'Item', type: 'string' },
    { key: 'qty', label: 'Qtd.', type: 'number' },
    { key: 'unit', label: 'Valor', type: 'number' },
  ],
  rows: [
    { label: 'Licença de software', qty: 3, unit: 1200 },
    { label: 'Suporte mensal', qty: 12, unit: 450 },
    { label: 'Treinamento', qty: 2, unit: 800 },
  ],
};
