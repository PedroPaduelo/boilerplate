/**
 * Testes da BASE do catálogo (T-I): os 7 blocos (kpi, bar_chart, line_chart,
 * donut, table, title, rich_text).
 *
 * Cobre:
 *  - validação de cada manifest contra o BlockManifestSchema (@dashboards/contracts);
 *  - render de cada bloco com sua fixture (não crasha + mostra o dado);
 *  - validação das fixtures de dados contra o shape declarado;
 *  - auto-registro via glob (registry contém os 7 tipos);
 *  - SANITIZAÇÃO do rich_text (XSS: <script>/onerror/javascript: removidos).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import {
  validateBlockManifest,
  formatErrors,
  validateBlockDataByShape,
  type BlockManifest,
  type DataShape,
} from '@dashboards/contracts';

import { definition as kpi } from './kpi/component';
import { definition as barChart } from './bar_chart/component';
import { definition as lineChart } from './line_chart/component';
import { definition as donut } from './donut/component';
import { definition as table } from './table/component';
import { definition as title } from './title/component';
import { definition as richText } from './rich_text/component';
import { renderMarkdown } from './rich_text/markdown';
import { listBlockTypes, getBlock } from '../registry';
import type { BlockDefinition } from '../types';

const BASE: BlockDefinition[] = [kpi, barChart, lineChart, donut, table, title, richText];
const BASE_TYPES = ['kpi', 'bar_chart', 'line_chart', 'donut', 'table', 'title', 'rich_text'];

afterEach(() => cleanup());

describe('catálogo base — manifests', () => {
  it('os 7 tipos esperados estão presentes', () => {
    expect(BASE.map((d) => d.type).sort()).toEqual([...BASE_TYPES].sort());
  });

  it.each(BASE)('manifest de "$type" é válido contra BlockManifestSchema', (def) => {
    const ok = validateBlockManifest(def.manifest);
    expect(ok, formatErrors(validateBlockManifest.errors)).toBe(true);
  });

  it('o type do manifest casa com a definition (e nome de pasta)', () => {
    for (const def of BASE) {
      expect(def.type).toBe((def.manifest as BlockManifest).type);
    }
  });

  it('blocos de dados têm dataContract; narrativos (title/rich_text) não', () => {
    const withData = ['kpi', 'bar_chart', 'line_chart', 'donut', 'table'];
    for (const def of BASE) {
      const has = Boolean(def.manifest.dataContract);
      expect(has).toBe(withData.includes(def.type));
    }
  });
});

describe('catálogo base — fixtures casam com o shape', () => {
  it.each([kpi, barChart, lineChart, donut, table])(
    'fixture de "$type" valida contra seu dataContract.shape',
    (def) => {
      const shape = def.manifest.dataContract?.shape as DataShape;
      const { valid, errors } = validateBlockDataByShape(shape, def.fixture);
      expect(valid, formatErrors(errors)).toBe(true);
    },
  );
});

describe('catálogo base — auto-registro (glob)', () => {
  it('registry expõe os 7 tipos da base', () => {
    const types = listBlockTypes();
    for (const t of BASE_TYPES) {
      expect(types).toContain(t);
      expect(getBlock(t)).toBeDefined();
    }
  });
});

describe('catálogo base — render com fixture', () => {
  it('kpi mostra o rótulo da fixture', () => {
    render(<kpi.Component props={{ showDelta: true }} data={kpi.fixture!} state="success" />);
    expect(screen.getByText('Total arrecadado')).toBeInTheDocument();
  });

  it('bar_chart desenha os rótulos do eixo (categorias)', () => {
    render(<barChart.Component props={{}} data={barChart.fixture!} state="success" />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Mai')).toBeInTheDocument();
  });

  it('line_chart desenha os rótulos temporais do eixo X', () => {
    render(<lineChart.Component props={{}} data={lineChart.fixture!} state="success" />);
    expect(screen.getByText('2026-01')).toBeInTheDocument();
    expect(screen.getByText('2026-06')).toBeInTheDocument();
  });

  it('donut lista as categorias na legenda', () => {
    render(<donut.Component props={{ showLegend: true }} data={donut.fixture!} state="success" />);
    expect(screen.getByText('Quitado')).toBeInTheDocument();
    expect(screen.getByText('Em aberto')).toBeInTheDocument();
  });

  it('table renderiza cabeçalhos e células', () => {
    render(<table.Component props={{}} data={table.fixture!} state="success" />);
    expect(screen.getByText('Município')).toBeInTheDocument();
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('Norte')).toBeInTheDocument();
  });

  it('title renderiza o texto como heading', () => {
    render(<title.Component props={{ text: 'Visão geral', level: 2 }} state="success" />);
    const heading = screen.getByText('Visão geral');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName.toLowerCase()).toBe('h2');
  });

  it('rich_text renderiza markdown como HTML', () => {
    render(
      <richText.Component
        props={{ markdown: '## Análise\n\nValor **alto** registrado.' }}
        state="success"
      />,
    );
    expect(screen.getByText('Análise')).toBeInTheDocument();
    expect(screen.getByText('alto')).toBeInTheDocument();
  });
});

describe('rich_text — sanitização (XSS)', () => {
  it('remove <script>', () => {
    const html = renderMarkdown('Olá<script>alert(1)</script> mundo');
    expect(html).not.toContain('<script');
    expect(html).toContain('Olá');
    expect(html).toContain('mundo');
  });

  it('remove handlers inline (onerror)', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html.toLowerCase()).not.toContain('onerror');
  });

  it('remove URLs javascript:', () => {
    const html = renderMarkdown('[clique](javascript:alert(1))');
    expect(html.toLowerCase()).not.toContain('javascript:');
  });

  it('preserva markdown legítimo (negrito, link http)', () => {
    const html = renderMarkdown('Texto **forte** e [link](https://example.com)');
    expect(html).toContain('<strong>forte</strong>');
    expect(html).toContain('href="https://example.com"');
  });
});
