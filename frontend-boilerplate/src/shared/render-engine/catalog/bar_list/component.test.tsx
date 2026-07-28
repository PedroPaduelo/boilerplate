/**
 * Regressão do bloco `bar_list` — o ranking que exibia "R$ 11,19 mil" para
 * CONTAGEM de eventos de webhook.
 *
 * O que este arquivo trava:
 * 1. UNIDADE NÃO SE INVENTA — o valor era formatado como moeda compacta em
 *    código, sem prop nenhuma: nem o agente nem o dashboard tinham como
 *    corrigir. Agora o default é número e moeda é escolha explícita.
 * 2. O INSIGHT CONCORDA COM A BARRA — o takeaway de rodapé repete o mesmo
 *    número e precisa usar o mesmo formato; ele também cravava moeda.
 * 3. A CAMADA VISUAL — ordem, proporção da barra, cor vinda do tema (nunca um
 *    literal), texto com Markdown/`{{variavel}}` e erro como aviso.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { useChartPalette } from '@/shared/ui';
import { definition } from './component';

const Block = definition.Component;

/**
 * `Intl.NumberFormat` separa o símbolo da moeda com espaço NÃO-QUEBRÁVEL
 * (U+00A0) — correto na tela, invisível no diff de um teste.
 */
const plain = (value: string) => value.replace(/\u00a0/g, ' ');

/** Contagem real de eventos por tipo (o caso que produziu o bug). */
const DATA = [
  { label: 'statuses', value: 11274 },
  { label: 'messages', value: 4021 },
];

/** Números redondos: a proporção da barra fica legível no diff. */
const RANKED = [
  { label: 'Beta', value: 25 },
  { label: 'Alfa', value: 100 },
];

/**
 * Sonda: expõe as cores que o TEMA resolve — a de série única (verde escuro a
 * 80%, §2.1 da referência) e as duas primeiras do ciclo. Comparar a barra com
 * a sonda prova que a cor atravessou a paleta, sem repetir cor no teste.
 */
function PaletteProbe() {
  const palette = useChartPalette();
  return (
    <span
      data-testid="palette-probe"
      data-single={palette.primary80}
      data-cycle-0={palette.colorAt(0)}
      data-cycle-1={palette.colorAt(1)}
    />
  );
}

/** Barras desenhadas, na ordem em que aparecem na lista. */
const barsOf = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[data-slot="ranking-bar-fill"]');

describe('bloco bar_list', () => {
  it('sem valueFormat declarado, contagem é número — não dinheiro', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={DATA} state="success" />,
    );

    expect(screen.getByText('11.274')).toBeInTheDocument();
    expect(container.textContent).not.toContain('R$');
  });

  it('moeda continua disponível — como escolha explícita', () => {
    const { container } = renderWithProviders(
      <Block props={{ valueFormat: 'compactBRL' }} data={DATA} state="success" />,
    );

    expect(plain(container.textContent ?? '')).toContain('R$ 11,27 mil');
  });

  it('o insight de rodapé usa o MESMO formato do bloco', () => {
    // Sem props: número, como as barras.
    expect(definition.deriveTakeaway?.(DATA, {})).toEqual([
      'Top 1: statuses (11.274)',
      'Último: messages (4.021)',
    ]);

    // Com moeda declarada: o insight acompanha, em vez de discordar da barra.
    const withCurrency = (
      definition.deriveTakeaway?.(DATA, { valueFormat: 'compactBRL' }) as string[]
    ).map(plain);
    expect(withCurrency).toEqual([
      'Top 1: statuses (R$ 11,27 mil)',
      'Último: messages (R$ 4,02 mil)',
    ]);
  });

  it('sem props (playground), o insight cai no default neutro', () => {
    // O editor de takeaways do playground chama sem o segundo argumento.
    expect(definition.deriveTakeaway?.(DATA)).toEqual([
      'Top 1: statuses (11.274)',
      'Último: messages (4.021)',
    ]);
  });

  it('ordena do maior para o menor e mede a barra pelo topo do ranking', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={RANKED} state="success" />,
    );

    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Alfa');
    expect(rows[1]).toHaveTextContent('Beta');

    const bars = barsOf(container);
    expect(bars[0].style.getPropertyValue('inline-size')).toBe('100%');
    expect(bars[1].style.getPropertyValue('inline-size')).toBe('25%');
  });

  it('série única pinta todas as barras com a cor de série única do tema', () => {
    const { container } = renderWithProviders(
      <>
        <PaletteProbe />
        <Block props={{}} data={RANKED} state="success" />
      </>,
    );

    const single = screen.getByTestId('palette-probe').getAttribute('data-single');
    const bars = barsOf(container);
    expect(single).toBeTruthy();
    expect(bars[0].style.getPropertyValue('--chart-bar').trim()).toBe(single);
    expect(bars[1].style.getPropertyValue('--chart-bar').trim()).toBe(single);
  });

  it('palette "multi" cicla a paleta, uma cor por linha', () => {
    const { container } = renderWithProviders(
      <>
        <PaletteProbe />
        <Block props={{ palette: 'multi' }} data={RANKED} state="success" />
      </>,
    );

    const probe = screen.getByTestId('palette-probe');
    const bars = barsOf(container);
    expect(bars[0].style.getPropertyValue('--chart-bar').trim()).toBe(
      probe.getAttribute('data-cycle-0'),
    );
    expect(bars[1].style.getPropertyValue('--chart-bar').trim()).toBe(
      probe.getAttribute('data-cycle-1'),
    );
  });

  it('rótulo e valor aceitam Markdown e {{variavel}} dos dados', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={[
          { label: '**IPTU** — {{contagem}} categorias', value: 10 },
          { label: 'ISS', value: 5 },
        ]}
        state="success"
      />,
    );

    expect(screen.getByText('IPTU').tagName).toBe('STRONG');
    expect(screen.getByText(/2 categorias/)).toBeInTheDocument();
  });

  it('erro vira aviso, não uma lista vazia com o texto do erro dentro', () => {
    renderWithProviders(<Block props={{}} state="error" error="Timeout na consulta" />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Timeout na consulta')).toBeInTheDocument();
  });

  it('sem dados, avisa em vez de desenhar uma lista vazia', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});
