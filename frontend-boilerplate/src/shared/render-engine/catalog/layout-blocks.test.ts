/**
 * O SISTEMA DE LAYOUT como um todo — o que existe, e o que nenhum deles pode
 * fazer.
 *
 * Os testes por bloco provam cada componente; este prova o CONJUNTO, que é o
 * que o agente de IA enxerga quando pede o catálogo. Três coisas são travadas:
 *
 *  1. QUAIS blocos de layout existem. O catálogo tinha nove, com duplicatas
 *     (`section` e `dashboard_panel` eram o mesmo shell) e com padrões de
 *     interação vendidos como layout (`expandable_cards`, `resizable_panels`).
 *     Vocabulário grande demais faz o agente escolher mal; se alguém acrescentar
 *     um container novo, este teste obriga a decisão a ser consciente.
 *
 *  2. Nenhum bloco de layout declara CONTEÚDO em `defaultProps`. O
 *     `BlockRenderer` mescla `manifest.defaultProps` em TODA renderização, então
 *     um título de fábrica chega ao componente indistinguível de uma escolha do
 *     autor — foi assim que todo divisor do produto nasceu escrito "Resumo do
 *     período" e toda seção sem nome, "Seção".
 *
 *  3. Nenhum deles nasce como CARD. Card em volta de blocos que já são cards
 *     empilha moldura sobre moldura e soma padding a cada nível.
 */
import { describe, expect, it } from 'vitest';
import { validateBlockManifest, formatErrors } from '@dashboards/contracts';
import { getBlock, listBlocks } from '../registry';
import type { BlockDefinition } from '../types';

/** O sistema de layout, por extenso. */
const LAYOUT_TYPES = ['grid', 'section', 'collapsible_block', 'sheet', 'divider'];

/** Os containers que envolvem uma GRADE (têm superfície configurável). */
const GRID_CONTAINERS = ['grid', 'section', 'collapsible_block'];

/**
 * `mobius_loop` declara `kind: 'layout'` no manifesto, mas é um indicador de
 * carregamento decorativo — a galeria já o classifica em "Efeitos". O `kind`
 * dele é uma imprecisão herdada, fora do escopo desta repaginação; fica
 * anotada aqui para que o teste continue sendo sobre o sistema de layout e não
 * passe a proteger o engano.
 */
const KIND_LAYOUT_BUT_DECORATIVE = ['mobius_loop'];

/**
 * Props que carregam TEXTO VISÍVEL. Um default aqui é conteúdo de fábrica.
 *
 * `triggerLabel` fica de FORA da lista de propósito: é o rótulo de um botão, e
 * um botão sem nome acessível não existe para quem usa leitor de tela — ali o
 * default é o recuo correto, não um enfeite.
 */
const CONTENT_PROPS = ['title', 'subtitle', 'description', 'label', 'text'];

const layoutBlocks = LAYOUT_TYPES.map((type) => getBlock(type)).filter(
  (def): def is BlockDefinition => Boolean(def),
);

function defaultsOf(def: BlockDefinition): Record<string, unknown> {
  return (def.manifest.defaultProps ?? {}) as Record<string, unknown>;
}

describe('sistema de layout — composição do catálogo', () => {
  it('todos os containers do sistema estão registrados', () => {
    expect(layoutBlocks.map((def) => def.type).sort()).toEqual([...LAYOUT_TYPES].sort());
  });

  it('e nenhum bloco de layout além deles', () => {
    const declarados = listBlocks()
      .filter((def) => def.manifest.kind === 'layout')
      .map((def) => def.type)
      .filter((type) => !KIND_LAYOUT_BUT_DECORATIVE.includes(type));

    expect(declarados.sort()).toEqual([...LAYOUT_TYPES].sort());
  });

  it('os blocos removidos continuam removidos', () => {
    // `dashboard_panel` era `section` com outro nome; `bento_grid` virou
    // `grid` com `itemSizing: 'span'`; `expandable_cards` e `resizable_panels`
    // eram interação (card obrigatório + altura fixa), não organização;
    // `hover_card` não organizava nada.
    const removidos = [
      'dashboard_panel',
      'bento_grid',
      'expandable_cards',
      'resizable_panels',
      'hover_card',
    ];
    const vivos = listBlocks().map((def) => def.type);
    for (const type of removidos) {
      expect(vivos).not.toContain(type);
    }
  });

  it.each(layoutBlocks)('manifest de "$type" é válido contra o contrato', (def) => {
    const ok = validateBlockManifest(def.manifest);
    expect(ok, formatErrors(validateBlockManifest.errors)).toBe(true);
  });
});

describe('sistema de layout — nenhum conteúdo de fábrica', () => {
  it.each(layoutBlocks)('"$type" não declara texto visível em defaultProps', (def) => {
    const conteudo = Object.keys(defaultsOf(def)).filter((key) =>
      CONTENT_PROPS.includes(key),
    );
    expect(conteudo).toEqual([]);
  });

  it.each(layoutBlocks)(
    '"$type" não fixa colunas nem altura de linha por padrão',
    (def) => {
      // As duas props existem para FORÇAR um arranjo. Um default de fábrica
      // apagaria a derivação automática (uma coluna por filho, altura pelo tipo
      // dos filhos) e daria 460px a uma linha de títulos.
      const defaults = defaultsOf(def);
      expect(defaults).not.toHaveProperty('columns');
      expect(defaults).not.toHaveProperty('rowHeight');
    },
  );
});

describe('sistema de layout — card é escolha, não padrão', () => {
  const containers = GRID_CONTAINERS.map((type) => getBlock(type)).filter(
    (def): def is BlockDefinition => Boolean(def),
  );

  it.each(containers)('"$type" nasce SEM card (superfície `plain`)', (def) => {
    expect(defaultsOf(def).variant).toBe('plain');
  });

  it.each(containers)('"$type" oferece card e moldura como opção explícita', (def) => {
    const schema = def.manifest.propsSchema as {
      properties?: Record<string, { enum?: unknown[] }>;
    };
    expect(schema.properties?.variant?.enum).toEqual(['plain', 'card', 'framed']);
  });
});
