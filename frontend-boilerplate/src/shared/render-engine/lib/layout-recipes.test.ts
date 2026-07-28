/**
 * As receitas de composição são para copiar — então precisam estar CERTAS.
 *
 * Um arranjo que só vive num texto de prompt apodrece em silêncio quando as
 * props mudam de nome. Estes testes são o que impede a receita de ensinar ao
 * agente um layout que o motor não entende mais.
 */
import { describe, expect, it } from 'vitest';
import type { Block } from '@dashboards/contracts';
import { LAYOUT_RECIPES, layoutRecipe, listLayoutRecipes } from './layout-recipes';
import { getBlock } from '../registry';

/** Todos os blocos da árvore, em profundidade. */
function flatten(block: Block): Block[] {
  return [block, ...(block.blocks ?? []).flatMap(flatten)];
}

const recipes = listLayoutRecipes();

describe('receitas de composição', () => {
  it('cobre os quatro arranjos que o agente mais precisa', () => {
    expect(recipes.map((recipe) => recipe.id)).toEqual([
      'uma_coluna',
      'duas_colunas',
      'tres_colunas',
      'kpis_e_graficos',
    ]);
  });

  it.each(recipes)('"$id" só usa tipos que existem no catálogo', (recipe) => {
    const desconhecidos = flatten(recipe.block)
      .map((block) => block.type)
      .filter((type) => !getBlock(type));

    expect(desconhecidos).toEqual([]);
  });

  it.each(recipes)('"$id" produz blocos válidos (id e span em todo nó)', (recipe) => {
    for (const block of flatten(recipe.block)) {
      expect(block.id).toBeTruthy();
      expect(block.span).toBeGreaterThanOrEqual(1);
      expect(block.span).toBeLessThanOrEqual(12);
    }
  });

  it.each(recipes)('"$id" não usa ids repetidos (o motor indexa por id)', (recipe) => {
    const ids = flatten(recipe.block).map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nenhuma receita fixa `rowHeight` — a altura vem do tipo dos filhos', () => {
    for (const recipe of recipes) {
      for (const block of flatten(recipe.block)) {
        expect(block.props ?? {}).not.toHaveProperty('rowHeight');
      }
    }
  });

  it('"2 colunas" fixa o par: 4 filhos viram 2+2, nunca 3+1', () => {
    const recipe = layoutRecipe('duas_colunas');
    expect(recipe.block.props?.columns).toBe(2);
  });

  it('"3 colunas" deixa o motor derivar — e o teto já é 3', () => {
    const recipe = layoutRecipe('tres_colunas');
    expect(recipe.block.props?.columns).toBeUndefined();
    expect(recipe.block.blocks).toHaveLength(3);
  });

  it('"KPIs + gráficos" são DUAS faixas, e não uma linha só', () => {
    // Se os KPIs e os gráficos dividissem a mesma linha, os cartões de número
    // herdariam a altura da série e virariam retângulos vazios — exatamente o
    // defeito que a escala de altura existe para evitar.
    const recipe = layoutRecipe('kpis_e_graficos');
    const faixas = recipe.block.blocks ?? [];

    expect(faixas).toHaveLength(2);
    expect(faixas.every((faixa) => faixa.type === 'grid')).toBe(true);
    expect(faixas[0].blocks?.every((child) => child.type === 'kpi')).toBe(true);
  });

  it('o mapa e a lista contam a mesma história', () => {
    expect(Object.keys(LAYOUT_RECIPES)).toHaveLength(recipes.length);
    expect(layoutRecipe('uma_coluna').block.props?.columns).toBe(1);
  });
});
