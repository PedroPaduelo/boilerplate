/** Fixture do bloco `table` — casa com o dataContract (shape 'table'). */
import type { TableData } from '@dashboards/contracts';

export const fixture: TableData = {
  columns: [
    { key: 'municipio', label: 'Município', type: 'string' },
    { key: 'valor', label: 'Valor', type: 'number' },
    { key: 'status', label: 'Status', type: 'string' },
  ],
  rows: [
    { municipio: 'Centro', valor: 1000, status: 'Quitado' },
    { municipio: 'Norte', valor: 2400, status: 'Em aberto' },
    { municipio: 'Sul', valor: 1800, status: 'Parcelado' },
  ],
};
