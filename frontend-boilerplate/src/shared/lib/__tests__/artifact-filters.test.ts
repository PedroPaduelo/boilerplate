import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ARTIFACT_FILTERS,
  filterArtifacts,
  hasActiveFilters,
  toServerFilters,
  type ArtifactFilterState,
  type FilterableArtifact,
} from '../artifact-filters';

const ME = 'user-me';

const items: FilterableArtifact[] = [
  {
    title: 'Vendas Mensais',
    status: 'PUBLISHED',
    visibility: 'ORG',
    departmentId: 'dep-fin',
    ownerId: ME,
  },
  {
    title: 'Rascunho de Receita',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    departmentId: 'dep-fin',
    ownerId: 'other',
  },
  {
    title: 'Indicadores de RH',
    status: 'PUBLISHED',
    visibility: 'DEPARTMENT',
    departmentId: 'dep-rh',
    ownerId: 'other',
  },
];

const filters = (over: Partial<ArtifactFilterState> = {}): ArtifactFilterState => ({
  ...DEFAULT_ARTIFACT_FILTERS,
  ...over,
});

describe('filterArtifacts', () => {
  it('sem filtros retorna tudo', () => {
    expect(filterArtifacts(items, filters(), ME)).toHaveLength(3);
  });

  it('busca por título (case-insensitive, substring)', () => {
    const r = filterArtifacts(items, filters({ search: 'receita' }), ME);
    expect(r.map((i) => i.title)).toEqual(['Rascunho de Receita']);
  });

  it('filtra por status', () => {
    const r = filterArtifacts(items, filters({ status: 'PUBLISHED' }), ME);
    expect(r).toHaveLength(2);
    expect(r.every((i) => i.status === 'PUBLISHED')).toBe(true);
  });

  it('filtra por visibilidade', () => {
    const r = filterArtifacts(items, filters({ visibility: 'DEPARTMENT' }), ME);
    expect(r.map((i) => i.title)).toEqual(['Indicadores de RH']);
  });

  it('filtra por departamento', () => {
    const r = filterArtifacts(items, filters({ departmentId: 'dep-rh' }), ME);
    expect(r.map((i) => i.title)).toEqual(['Indicadores de RH']);
  });

  it('filtra "meus" pelo ownerId do usuário logado', () => {
    const r = filterArtifacts(items, filters({ owner: 'MINE' }), ME);
    expect(r.map((i) => i.title)).toEqual(['Vendas Mensais']);
  });

  it('combina múltiplos filtros (status + departamento)', () => {
    const r = filterArtifacts(
      items,
      filters({ status: 'PUBLISHED', departmentId: 'dep-fin' }),
      ME,
    );
    expect(r.map((i) => i.title)).toEqual(['Vendas Mensais']);
  });

  it('combinação sem resultado retorna vazio', () => {
    const r = filterArtifacts(
      items,
      filters({ status: 'DRAFT', owner: 'MINE' }),
      ME,
    );
    expect(r).toHaveLength(0);
  });
});

describe('hasActiveFilters', () => {
  it('false no estado default', () => {
    expect(hasActiveFilters(DEFAULT_ARTIFACT_FILTERS)).toBe(false);
  });
  it('true quando há busca ou filtro', () => {
    expect(hasActiveFilters(filters({ search: 'x' }))).toBe(true);
    expect(hasActiveFilters(filters({ status: 'DRAFT' }))).toBe(true);
    expect(hasActiveFilters(filters({ owner: 'MINE' }))).toBe(true);
  });
});

describe('toServerFilters', () => {
  it('omite campos ALL/vazios e inclui paginação', () => {
    expect(toServerFilters(DEFAULT_ARTIFACT_FILTERS, 2, 12)).toEqual({
      page: 2,
      pageSize: 12,
    });
  });

  it('inclui apenas filtros suportados server-side (search/status/visibility)', () => {
    const f = filters({
      search: '  vendas  ',
      status: 'PUBLISHED',
      visibility: 'ORG',
      departmentId: 'dep-fin', // client-side: NÃO vai ao servidor
      owner: 'MINE', // client-side: NÃO vai ao servidor
    });
    expect(toServerFilters(f, 1, 12)).toEqual({
      page: 1,
      pageSize: 12,
      search: 'vendas',
      status: 'PUBLISHED',
      visibility: 'ORG',
    });
  });
});
