/**
 * Fixture do bloco `funnel_stage` — uma etapa N1 de exemplo (preview/catálogo).
 */
import type { TableData } from '@dashboards/contracts';

export const fixture: TableData = {
  columns: [
    { key: 'tipo', label: 'tipo', type: 'string' },
    { key: 'icone', label: 'icone', type: 'string' },
    { key: 'desfecho', label: 'desfecho', type: 'string' },
    { key: 'descricao', label: 'descricao', type: 'string' },
    { key: 'quantidade', label: 'quantidade', type: 'number' },
    { key: 'valor_original', label: 'valor_original', type: 'number' },
    { key: 'valor_atualizado', label: 'valor_atualizado', type: 'number' },
  ],
  rows: [
    { tipo: 'resumo', quantidade: 10835362, pct: 1, valor: 3745086826.03 },
    {
      tipo: 'desfecho',
      icone: 'CircleCheck',
      desfecho: 'Pago como lançamento',
      descricao: 'Pago e nunca inscrito em Dívida Ativa.',
      quantidade: 8060686,
      valor_original: 2767231605.76,
      valor_atualizado: 5250514766.99,
    },
    {
      tipo: 'desfecho',
      icone: 'CircleX',
      desfecho: 'Cancelado (exclusão física)',
      descricao: 'Exclusão física da DUAM. Fora do snapshot.',
      quantidade: 11925,
      valor_original: 5393877.67,
      valor_atualizado: 7629894.09,
    },
    {
      tipo: 'desfecho',
      icone: 'ArrowDown',
      desfecho: 'Continua - Dívida Ativa',
      descricao: 'Não resolvido no lançamento: foi para a Dívida Ativa.',
      quantidade: 2774676,
      valor_original: 977855220.27,
      valor_atualizado: 3543919447.42,
    },
    {
      tipo: 'total',
      desfecho: 'Total lançado (universo, exclui cancelado)',
      quantidade: 10835362,
      valor_original: 3745086826.03,
      valor_atualizado: 8794434214.41,
    },
  ],
};
