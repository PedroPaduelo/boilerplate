/**
 * O que este arquivo trava:
 *
 * 1. **COBERTURA DO CONTRATO** — toda chave de `SEMANTIC_ICONS` tem desenho
 *    próprio. Sem isto, acrescentar um nome ao contrato e esquecer do mapa
 *    passa despercebido: a tela não quebra, só mostra o marcador neutro em
 *    silêncio — o pior tipo de defeito, porque parece intencional.
 * 2. **CONTRATO DE RENDERIZAÇÃO** — grade 24×24, cor herdada, sem tamanho
 *    fixo. É o que garante que o ícone obedeça ao consumidor (o `Icon` do
 *    Astryx, o CSS da navegação) em vez de brigar com ele.
 * 3. **ACESSIBILIDADE** — decorativo por padrão, nomeável quando precisa.
 */
import { render } from '@testing-library/react';
import { SEMANTIC_ICONS } from '@dashboards/contracts';
import { describe, expect, it } from 'vitest';

import * as icons from '../index';
import { FALLBACK_ICON, blockIcon, semanticIcon } from '../../semantic-icons';
import type { AppIcon } from '../types';

/**
 * Todo ícone exportado pelo módulo. O `IconBase` fica de fora: é a moldura, não
 * um ícone (exige filhos). A leitura é pelo BARREL de propósito — assim um
 * ícone novo entra na bateria abaixo sem ninguém lembrar de inscrevê-lo aqui.
 */
const REGISTRY: Record<string, unknown> = icons;
const ALL = Object.entries(REGISTRY).filter(
  (entry): entry is [string, AppIcon] =>
    typeof entry[1] === 'function' && entry[0] !== 'IconBase',
);

function svgOf(Icon: AppIcon, props = {}) {
  const { container } = render(<Icon data-testid="icon" {...props} />);
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('o ícone não renderizou um <svg>');
  return svg;
}

describe('mapa semântico → pacote real', () => {
  it('cobre TODAS as chaves do contrato, sem cair no marcador neutro', () => {
    const semFonte = SEMANTIC_ICONS.filter(
      (name) => semanticIcon(name) === FALLBACK_ICON,
    );
    expect(semFonte).toEqual([]);
  });

  it('dá desenhos DISTINTOS para chaves distintas', () => {
    const distintos = new Set(SEMANTIC_ICONS.map((name) => semanticIcon(name)));
    expect(distintos.size).toBe(SEMANTIC_ICONS.length);
  });

  it('cai no marcador neutro quando o nome falta ou é desconhecido', () => {
    expect(semanticIcon()).toBe(FALLBACK_ICON);
    expect(semanticIcon('não-existe')).toBe(FALLBACK_ICON);
    expect(FALLBACK_ICON).toBe(icons.NeutralMarkerIcon);
  });

  it('no BLOCO, sem ícone declarado nem derivável, não inventa marcador', () => {
    expect(blockIcon(undefined, undefined)).toBeUndefined();
    expect(blockIcon('não-existe', undefined)).toBeUndefined();
    expect(blockIcon('money', undefined)).toBe(icons.MoneyIcon);
    // Derivado do TIPO do bloco, que é a regra do contrato.
    expect(blockIcon(undefined, 'bar_chart')).toBeDefined();
  });

  it('exporta os ícones do menu e da navegação fixados no CONTRATO §6', () => {
    for (const nome of [
      'HomeIcon',
      'DashboardsIcon',
      'ChartsIcon',
      'CatalogIcon',
      'ConnectionsIcon',
      'ChatIcon',
      'UsersIcon',
      'ArrowIosForwardIcon',
      'ArrowIosDownwardIcon',
      'ArrowIosBackIcon',
      'InfoOutlineIcon',
    ] as const) {
      expect(typeof icons[nome]).toBe('function');
    }
  });
});

describe('contrato de renderização (vale para os 36)', () => {
  it.each(ALL)('%s desenha na grade 24×24 sem tamanho fixo', (_nome, Icon) => {
    const svg = svgOf(Icon);
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    // Sem width/height: quem dimensiona é o CSS do consumidor.
    expect(svg.hasAttribute('width')).toBe(false);
    expect(svg.hasAttribute('height')).toBe(false);
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.childElementCount).toBeGreaterThan(0);
  });

  it.each(ALL)('%s herda a cor do texto (nada de cor fixa)', (_nome, Icon) => {
    const svg = svgOf(Icon);
    // Marcas de cor literal: hex, rgb() e nomes de cor CSS não aparecem.
    expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    expect(svg.outerHTML).toMatch(/currentColor/);
  });

  it.each(ALL)('%s aceita atributos do consumidor', (_nome, Icon) => {
    const svg = svgOf(Icon, { className: 'x-24', width: 24, height: 24 });
    expect(svg.getAttribute('class')).toBe('x-24');
    expect(svg.getAttribute('width')).toBe('24');
  });
});

describe('acessibilidade', () => {
  it('é decorativo por padrão — não entra na árvore de acessibilidade', () => {
    expect(svgOf(icons.HomeIcon).getAttribute('aria-hidden')).toBe('true');
  });

  it('deixa de ser decorativo quando o consumidor o NOMEIA', () => {
    // É o que o `Icon` do Astryx faz ao receber `label`: role + aria-label,
    // sem aria-hidden. Emitir aria-hidden aqui apagaria esse nome.
    const nomeado = svgOf(icons.HomeIcon, { role: 'img', 'aria-label': 'Início' });
    expect(nomeado.hasAttribute('aria-hidden')).toBe(false);
    expect(nomeado.getAttribute('aria-label')).toBe('Início');

    const porId = svgOf(icons.HomeIcon, { 'aria-labelledby': 'titulo' });
    expect(porId.hasAttribute('aria-hidden')).toBe(false);
  });

  it('deixa o consumidor forçar aria-hidden explicitamente', () => {
    const svg = svgOf(icons.HomeIcon, { 'aria-label': 'x', 'aria-hidden': true });
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
