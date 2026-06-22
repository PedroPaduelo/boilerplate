import { describe, it, expect } from 'vitest';
import { dashboardLayoutFixture } from '@dashboards/contracts';
import {
  initialFilterValues,
  blocksAffectedByFilter,
  isFilterUsed,
  type DashFilter,
} from './dashboard-filters';

describe('dashboard-filters (helpers puros)', () => {
  const filters = dashboardLayoutFixture.filters as DashFilter[];

  it('initialFilterValues extrai os defaults dos filtros do layout', () => {
    const values = initialFilterValues(filters);
    expect(values).toEqual({
      f_periodo: { from: '2026-01-01', to: '2026-12-31' },
      f_situacao: 'todas',
    });
  });

  it('initialFilterValues ignora filtros sem default', () => {
    const values = initialFilterValues([
      { id: 'f1', type: 'search', label: 'Busca' },
    ]);
    expect(values).toEqual({});
  });

  it('blocksAffectedByFilter retorna só os blocos que escutam o filtro', () => {
    // f_periodo é param de blk_kpi_total e blk_bar_mes.
    expect(blocksAffectedByFilter(dashboardLayoutFixture, 'f_periodo')).toEqual([
      'blk_kpi_total',
      'blk_bar_mes',
    ]);
    // f_situacao só de blk_donut.
    expect(blocksAffectedByFilter(dashboardLayoutFixture, 'f_situacao')).toEqual([
      'blk_donut',
    ]);
  });

  it('blocksAffectedByFilter vazio para filtro que nenhum bloco escuta', () => {
    expect(blocksAffectedByFilter(dashboardLayoutFixture, 'f_inexistente')).toEqual([]);
  });

  it('isFilterUsed reflete se há blocos afetados', () => {
    expect(isFilterUsed(dashboardLayoutFixture, 'f_periodo')).toBe(true);
    expect(isFilterUsed(dashboardLayoutFixture, 'f_inexistente')).toBe(false);
  });
});
