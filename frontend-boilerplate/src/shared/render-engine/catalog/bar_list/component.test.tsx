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
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
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
});
