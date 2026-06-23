/** Fixture do bloco `data_table` — casa com o dataContract (shape 'table'). */
import type { TableData } from '@dashboards/contracts';

export const fixture: TableData = {
  columns: [
    { key: 'municipio', label: 'Município', type: 'string' },
    { key: 'arrecadado', label: 'Arrecadado', type: 'number' },
    { key: 'inadimplencia', label: 'Inadimplência', type: 'number' },
    { key: 'status', label: 'Status', type: 'string' },
  ],
  rows: [
    { municipio: 'Centro', arrecadado: 128000, inadimplencia: 12, status: 'Em dia' },
    { municipio: 'Norte', arrecadado: 98400, inadimplencia: 23, status: 'Atenção' },
    { municipio: 'Sul', arrecadado: 87600, inadimplencia: 18, status: 'Em dia' },
    { municipio: 'Leste', arrecadado: 64200, inadimplencia: 31, status: 'Crítico' },
    { municipio: 'Oeste', arrecadado: 52100, inadimplencia: 27, status: 'Atenção' },
    { municipio: 'Industrial', arrecadado: 141500, inadimplencia: 9, status: 'Em dia' },
  ],
};
