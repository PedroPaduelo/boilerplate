/**
 * Regressão do bloco `donut` depois da repaginação visual (§9/§10 da
 * referência).
 *
 * O que este arquivo trava:
 * 1. A LEGENDA É A LEITURA — o anel mostra proporção; quem dá o número é a
 *    legenda (categoria + valor + participação). Sem ela o bloco vira enfeite.
 * 2. OS QUATRO ESTADOS — carregando, sem dados, com dados e com erro.
 * 3. COR DE TOKEN — o acento antigo vira token de dado do design system, e a
 *    cor da legenda é a MESMA que pinta a fatia.
 * 4. UNIDADE NÃO SE INVENTA — sem `valueFormat` declarado o valor sai como
 *    NÚMERO. Este teste já afirmou "R$ 62,00" para uma composição de 62 e 38
 *    unidades: o default de moeda transformava contagem em dinheiro, e o teste
 *    congelava o bug em vez de pegá-lo.
 * 5. O CONTRATO COMUM — o rótulo central aceita `{{variavel}}` dos dados.
 *
 * Consultas por papel acessível e por texto — nunca por classe (os nomes são
 * hashes do StyleX, novos a cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const Block = definition.Component;

/** Quitado 62 + Em aberto 38 = 100 → percentuais redondos, fáceis de afirmar. */
const DATA = [
  { label: 'Quitado', value: 62 },
  { label: 'Em aberto', value: 38 },
];

describe('bloco donut', () => {
  it('lista categoria, valor e participação na legenda', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByText('Quitado')).toBeInTheDocument();
    expect(screen.getByText('62 (62%)')).toBeInTheDocument();
    expect(screen.getByText('Em aberto')).toBeInTheDocument();
    expect(screen.getByText('38 (38%)')).toBeInTheDocument();
  });

  it('sem valueFormat declarado, o valor é número — não dinheiro', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={DATA} state="success" />,
    );
    expect(screen.getByText('62 (62%)')).toBeInTheDocument();
    // Nenhum "R$" em lugar nenhum do bloco (legenda, total central, tooltip):
    // a composição é de 62 e 38 unidades, e unidade não se inventa.
    expect(container.textContent).not.toContain('R$');
  });

  it('moeda continua disponível — como escolha explícita', () => {
    renderWithProviders(
      <Block props={{ valueFormat: 'BRL' }} data={DATA} state="success" />,
    );
    expect(screen.getByText('R$ 62,00 (62%)')).toBeInTheDocument();
  });

  it('esconde a legenda quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showLegend: false }} data={DATA} state="success" />,
    );
    expect(screen.queryByText('Quitado')).not.toBeInTheDocument();
  });

  it('desenha o total no vão central, sob o rótulo declarado', () => {
    renderWithProviders(
      <Block props={{ centerLabel: 'Contratos' }} data={DATA} state="success" />,
    );
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Contratos')).toBeInTheDocument();
  });

  it('interpola {{variaveis}} dos dados no rótulo central', () => {
    // Contrato comum (briefing §5): todo texto do bloco aceita `{{variavel}}`
    // resolvida a partir dos DADOS — aqui, a categoria da maior fatia.
    renderWithProviders(
      <Block
        props={{ centerLabel: 'Maior: {{rotuloMaximo}}' }}
        data={DATA}
        state="success"
      />,
    );
    expect(screen.getByText('Maior: Quitado')).toBeInTheDocument();
  });

  it('anuncia o anel como imagem de dados com equivalente textual', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByRole('img', { name: 'Donut' })).toBeInTheDocument();
    expect(screen.getByText(/2 categorias/)).toBeInTheDocument();
  });

  it('cobre carregando, sem dados e erro', () => {
    const loading = renderWithProviders(<Block props={{}} state="loading" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    loading.unmount();

    const empty = renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    empty.unmount();

    // Erro não é "vazio com outro texto": tem aviso próprio (`ChartFrame`).
    renderWithProviders(
      <Block props={{}} data={DATA} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });

  it('resolve o acento antigo para um token de dado do sistema', () => {
    // A cor de dado do app sai SEMPRE de token do DS (`chart-theme`): o
    // vocabulário antigo (`bg-emerald-500`) é traduzido na fronteira e nunca
    // chega ao desenho. O token do verde folha é `--ds-color-success-main`.
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: 'bg-emerald-500' }}
        data={DATA}
        state="success"
      />,
    );
    expect(container.innerHTML).toContain('--ds-color-success-main');
    expect(container.innerHTML).not.toContain('emerald');
  });

  it('sem acento fixo, a 1ª fatia é o verde escuro a 80% da referência', () => {
    // `03-tipos-de-grafico.md` §9: a sequência da proporção começa no VERDE80
    // (`rgba(0, 120, 103, 0.8)`), não na 1ª cor do ciclo dos cartesianos.
    //
    // A asserção é feita na LEGENDA porque as fatias do recharts só existem
    // depois da animação de entrada (em jsdom, o 1º quadro não tem setor) —
    // e legenda e fatia saem do MESMO resolvedor de cor, de propósito: cor
    // diferente entre as duas é o pior defeito de um gráfico de composição.
    const { container } = renderWithProviders(
      <Block props={{ palette: 'multi' }} data={DATA} state="success" />,
    );
    expect(container.innerHTML).toContain('rgba(0, 120, 103, 0.8)');
  });
});
