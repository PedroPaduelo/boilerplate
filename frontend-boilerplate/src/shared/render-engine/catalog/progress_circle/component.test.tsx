/**
 * Regressão do bloco `progress_circle` depois da repaginação para o vocabulário
 * dos circulares da referência (rosca §10 + medidores §11–§13).
 *
 * O que este arquivo trava:
 * 1. VALOR DE VERDADE — o anel se anuncia como `progressbar` com valor, mínimo
 *    e máximo; o percentual não existe só como desenho.
 * 2. LAYOUT DA REFERÊNCIA — volta completa, trilha de 16%
 *    (`--ds-color-action-selected`), valor central 17,5px/700 e "Total"
 *    12,25px/600 na cor de rótulo (`01-fundamentos.md` §4).
 * 3. COR — `variant` mapeia para o tom do sistema (uma cor por valor) e um
 *    `accent` preenchido vence o variant com a COR DE SÉRIE pedida (uma cor por
 *    valor do enum). Era aqui o defeito relatado: qualquer `accent` virava o
 *    mesmo tom de destaque, então os seis valores desenhavam igual e o
 *    `variant` ficava mudo para sempre depois da primeira escolha de cor.
 * 4. LEITURA COMPLETA — com escala própria, a leitura diz "X% (v de max)".
 * 5. CONTRATO COMUM — rótulo aceita `{{variavel}}`; carregando, sem dados e
 *    erro nunca viram área em branco.
 *
 * Consultas por PAPEL e por atributo de dado — nunca por classe (os nomes são
 * hashes do StyleX).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/**
 * Cor do ARCO DE VALOR — o traço que responde por `variant`/`accent`.
 *
 * É lida SEM `waitFor` de propósito: o arco deixou de ser um `<Pie>` animado
 * pelo motor (que não escrevia caminho nenhum no primeiro quadro) e passou a
 * ser um `<circle>` com `stroke-dasharray`. Se um dia ele voltar a nascer
 * invisível, estes casos falham — que é exatamente o defeito que se quer
 * trancar.
 */
function arcColor(container: HTMLElement): string {
  return (
    container
      .querySelector('[data-slot="progress-circle-value"]')
      ?.getAttribute('stroke') ?? ''
  );
}

/** Cor da TRILHA (o anel apagado, atrás do arco). */
function trackColor(container: HTMLElement): string {
  return (
    container
      .querySelector('[data-slot="progress-circle-track"]')
      ?.getAttribute('stroke') ?? ''
  );
}

/** Desenha o bloco com as props dadas e devolve a cor do arco. */
function renderArc(props: Record<string, unknown>): string {
  const { container, unmount } = renderWithProviders(
    <Block props={props} data={fixture} state="success" />,
  );
  const color = arcColor(container);
  unmount();
  return color;
}

describe('bloco progress_circle — leitura e acessibilidade', () => {
  it('anuncia o anel como progressbar, com valor e escala', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const bar = screen.getByRole('progressbar', { name: 'Conclusão' });

    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '75% — Conclusão');
  });

  it('escreve o percentual e o rótulo no centro do anel', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Conclusão')).toBeInTheDocument();
  });

  it('usa "Total" quando o dado não traz rótulo', () => {
    renderWithProviders(<Block props={{}} data={{ value: 40 }} state="success" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('explicita "X de Y" quando a escala não é percentual', () => {
    renderWithProviders(
      <Block
        props={{ max: 500 }}
        data={{ value: 125, label: 'Processos' }}
        state="success"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Processos' });

    expect(bar).toHaveAttribute('aria-valuemax', '500');
    expect(screen.getByText('25%')).toBeInTheDocument();
    // A leitura completa fica no equivalente textual, para leitor de tela.
    expect(screen.getByText('25% (125 de 500)')).toBeInTheDocument();
  });
});

describe('bloco progress_circle — layout dos circulares', () => {
  it('usa a trilha de 16% da referência', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    expect(trackColor(container)).toBe('rgba(145 158 171 / 0.16)');
  });

  it('desenha o arco JÁ no primeiro render, sem esperar animação', () => {
    // O defeito de origem: o arco era um `<Pie>` animado pelo motor e no
    // primeiro quadro não existia no DOM — para SSR, impressão, captura de
    // tela e para a auditoria de props, o anel era só a trilha cinza, e
    // `variant`/`accent` não mudavam nada.
    const { container } = renderWithProviders(
      <Block props={{ variant: 'success' }} data={fixture} state="success" />,
    );
    expect(arcColor(container)).toBe('#22C55E');
  });

  it('escreve o valor em 17,5px/700 e o "Total" em 12,25px/600', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);

    const value = screen.getByText('75%');
    expect(value).toHaveAttribute('font-size', '17.5');
    expect(value).toHaveAttribute('font-weight', '700');
    expect(value).toHaveAttribute('fill', '#1C252E');

    const total = screen.getByText('Conclusão');
    expect(total).toHaveAttribute('font-size', '12.25');
    expect(total).toHaveAttribute('font-weight', '600');
    expect(total).toHaveAttribute('fill', '#637381');
  });

  /**
   * TODO valor de `variant` pinta um tom DIFERENTE — não basta "a prop é
   * lida": o que o usuário reclamou foi de trocar a variante e a tela não
   * mudar. Por isso o caso percorre o enum inteiro e exige cinco cores.
   */
  it.each([
    ['default', '#00A76F'],
    ['neutral', '#919EAB'],
    ['warning', '#FFAB00'],
    ['error', '#FF5630'],
    ['success', '#22C55E'],
  ])('pinta o anel com o tom semântico de variant="%s"', (variant, color) => {
    expect(renderArc({ variant })).toBe(color);
  });

  it('desenha uma cor por valor de variant (nenhum par empata)', () => {
    const tones = ['default', 'neutral', 'warning', 'error', 'success'].map((variant) =>
      renderArc({ variant }),
    );
    expect(new Set(tones).size).toBe(tones.length);
  });

  /**
   * `accent` vence o `variant` (regra de `chart-accent.ts`) e pinta a COR DE
   * SÉRIE pedida. Antes, qualquer acento virava o tom de destaque: os seis
   * valores do enum desenhavam o mesmo anel verde.
   */
  it.each([
    ['chart-1', '#00A76F'],
    ['chart-2', '#FFAB00'],
    ['chart-3', '#00B8D9'],
    ['chart-4', '#FF5630'],
    ['chart-5', '#22C55E'],
  ])('pinta o anel com a cor de série de accent="%s"', (accent, color) => {
    expect(renderArc({ variant: 'neutral', accent })).toBe(color);
  });

  it('deixa o acento vencer o variant, sem apagar o resto do enum', () => {
    // O acento manda...
    expect(renderArc({ variant: 'error', accent: 'chart-3' })).toBe('#00B8D9');
    // ...e `primary` é sinônimo de `chart-1` (as duas são a 1ª cor da paleta).
    expect(renderArc({ accent: 'primary' })).toBe(renderArc({ accent: 'chart-1' }));
  });

  it('volta ao variant quando o acento não descreve uma cor do sistema', () => {
    // Cor crua nunca chega ao desenho (`chartAccentColor` devolve nada), e o
    // bloco não pode ficar sem cor por causa disso: o tom volta a mandar.
    expect(renderArc({ variant: 'warning', accent: '#40E0D0' })).toBe('#FFAB00');
    expect(renderArc({ variant: 'warning', accent: '' })).toBe('#FFAB00');
  });
});

describe('bloco progress_circle — contrato comum', () => {
  it('resolve {{variavel}} no rótulo e no nome acessível', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={{ value: 75, label: '{{valor}} de cobertura' }}
        state="success"
      />,
    );
    expect(
      screen.getByRole('progressbar', { name: '75 de cobertura' }),
    ).toBeInTheDocument();
    expect(screen.getByText('75 de cobertura')).toBeInTheDocument();
  });

  it('cobre carregando, sem dados e erro', () => {
    const carregando = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    carregando.unmount();

    const vazio = renderWithProviders(
      <Block props={{}} data={{ value: null }} state="success" />,
    );
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    vazio.unmount();

    renderWithProviders(<Block props={{}} state="error" error="Consulta expirou" />);
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});
