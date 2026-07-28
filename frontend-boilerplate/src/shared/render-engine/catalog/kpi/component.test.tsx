/**
 * Regressão do bloco `kpi` depois da repaginação para o card de resumo da
 * referência (`04-widgets-prontos.md` §2).
 *
 * O que este arquivo trava:
 * 1. CARD PRÓPRIO — o bloco não recebe a moldura do motor, então o título é
 *    responsabilidade dele: `label` (ou `data.label`) tem de aparecer.
 * 2. CONTRATO COMUM — rótulo com Markdown e `{{variavel}}` resolvida a partir
 *    dos dados.
 * 3. TENDÊNCIA — vira o bloco ancorado no canto, com `+` no positivo, e a cor
 *    continua sendo LEITURA DE NEGÓCIO (`deltaPolarity`), não o sinal.
 * 4. ESTADOS — carregando, vazio e erro; nenhum deles é área em branco.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

describe('bloco kpi', () => {
  it('desenha o próprio cabeçalho e o valor formatado pela unidade', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('Total arrecadado')).toBeInTheDocument();
    expect(screen.getByText('R$ 1,28 mi')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="kpi-card"]')).toBeInTheDocument();
  });

  it('o rótulo aceita Markdown e {{variavel}} dos dados', () => {
    renderWithProviders(
      <Block
        props={{ label: 'Total em **{{unidade}}**' }}
        data={fixture}
        state="success"
      />,
    );

    const emphasis = screen.getByText('BRL');
    expect(emphasis).toBeInTheDocument();
    expect(emphasis.tagName.toLowerCase()).toBe('strong');
  });

  it('ancora a variação no canto do card, com sinal explícito', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="summary-card-trend"]'),
    ).toBeInTheDocument();
  });

  it('marca a alta como piora quando subir é ruim', () => {
    const { container } = renderWithProviders(
      <Block props={{ deltaPolarity: 'up-bad' }} data={fixture} state="success" />,
    );

    const trend = container.querySelector('[data-slot="delta-badge"]');
    expect(trend).toHaveAttribute('data-variant', 'error');
  });

  it('esconde a variação quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showDelta: false }} data={fixture} state="success" />,
    );

    expect(screen.queryByText('+12%')).not.toBeInTheDocument();
  });

  it('reserva a caixa de 48×48 quando há ícone', () => {
    const { container } = renderWithProviders(
      <Block props={{ icon: 'DollarSign' }} data={fixture} state="success" />,
    );

    expect(
      container.querySelector('[data-slot="summary-card-icon"]'),
    ).toBeInTheDocument();
  });

  /**
   * TODO nome do enum `icon` tem de desenhar um ícone — e ícones DIFERENTES.
   *
   * Cinco deles (`BarChart3`, `LineChart`, `PieChart`, `AlertTriangle`,
   * `CheckCircle2`) foram aposentados pelo lucide e sumiram do registry por
   * onde o resolver procura: resolviam para `undefined` e o card saía SEM
   * ícone. Cinco valores do enum, um desenho só — a auditoria de inércia
   * mostrava os cinco empatados. A tradução mora em `lib/lucide-resolver.ts`.
   */
  describe('icon', () => {
    const iconPathOf = (icon: string) => {
      const view = renderWithProviders(
        <Block props={{ icon }} data={fixture} state="success" />,
      );
      const svg = view.container.querySelector('[data-slot="summary-card-icon"] svg');
      const drawing = svg?.innerHTML ?? '';
      view.unmount();
      return drawing;
    };

    it.each(['BarChart3', 'LineChart', 'PieChart', 'AlertTriangle', 'CheckCircle2'])(
      'desenha o ícone aposentado "%s" pelo nome atual do lucide',
      (icon) => {
        expect(iconPathOf(icon)).not.toBe('');
      },
    );

    it('os cinco ícones aposentados desenham figuras distintas', () => {
      const drawings = [
        'BarChart3',
        'LineChart',
        'PieChart',
        'AlertTriangle',
        'CheckCircle2',
      ].map(iconPathOf);
      expect(new Set(drawings).size).toBe(drawings.length);
    });

    it('nome desconhecido continua degradando para "sem ícone"', () => {
      const { container } = renderWithProviders(
        <Block props={{ icon: 'NaoExiste' }} data={fixture} state="success" />,
      );
      expect(container.querySelector('[data-slot="summary-card-icon"]')).toBeNull();
    });
  });

  /**
   * CABEÇALHO — o texto de apoio era cravado no componente ("vs. período
   * anterior") e aparecia até em métrica que não compara período nenhum. A
   * prop existia no card e no bloco irmão (`stat_tile`); faltava no manifesto
   * deste, então nem o autor nem o agente tinham como corrigir.
   */
  describe('hint (texto de apoio)', () => {
    it('sem a prop, mantém o texto padrão do card', () => {
      renderWithProviders(<Block props={{}} data={fixture} state="success" />);
      expect(screen.getByText('vs. período anterior')).toBeInTheDocument();
    });

    it('troca o texto quando o bloco declara outro', () => {
      renderWithProviders(
        <Block props={{ hint: 'acumulado no ano' }} data={fixture} state="success" />,
      );
      expect(screen.getByText('acumulado no ano')).toBeInTheDocument();
      expect(screen.queryByText('vs. período anterior')).not.toBeInTheDocument();
    });

    it('string vazia esconde a linha inteira', () => {
      renderWithProviders(<Block props={{ hint: '' }} data={fixture} state="success" />);
      expect(screen.queryByText('vs. período anterior')).not.toBeInTheDocument();
    });
  });

  it('carregando: mantém o título e troca o número por esqueleto', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="loading" />);

    expect(screen.getByText('Total arrecadado')).toBeInTheDocument();
    expect(screen.queryByText('R$ 1,28 mi')).not.toBeInTheDocument();
  });

  it('vazio: diz que não há dado em vez de mostrar zero', () => {
    renderWithProviders(<Block props={{}} data={undefined} state="empty" />);

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument();
  });

  it('erro: mostra o aviso e o detalhe recebido', () => {
    renderWithProviders(
      <Block props={{}} data={undefined} state="error" error="timeout na consulta" />,
    );

    expect(screen.getByText('Erro ao carregar os dados')).toBeInTheDocument();
    expect(screen.getByText('timeout na consulta')).toBeInTheDocument();
  });
});
