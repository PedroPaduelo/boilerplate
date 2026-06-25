/**
 * Unit — pós-processador de formatação WhatsApp (`mdToWhatsapp`).
 *
 * O WhatsApp NÃO renderiza markdown: negrito é `*x*` (1 asterisco), não
 * `**x**`; não existe heading (`#`), nem tabela markdown. Esta função
 * converte o markdown que o modelo insiste em produzir para a sintaxe
 * nativa do WhatsApp, deterministicamente, sobre o texto final do agente.
 */

// Mock do env pra importar o handler sem estourar a validação do Zod.
jest.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'sk-test', AI_BASE_URL: '', AI_MODEL: 'x' },
}));

import { mdToWhatsapp } from '@/modules/channels/handler';

describe('channels/handler — mdToWhatsapp', () => {
  it('**bold** -> *bold* (1 asterisco)', () => {
    expect(mdToWhatsapp('isso é **importante** demais')).toBe('isso é *importante* demais');
  });

  it('__bold__ -> *bold*', () => {
    expect(mdToWhatsapp('texto __forte__ aqui')).toBe('texto *forte* aqui');
  });

  it('## Titulo -> *Titulo* (negrito, sem o #)', () => {
    expect(mdToWhatsapp('## Painel de CDA')).toBe('*Painel de CDA*');
  });

  it('# / ### headings também viram *texto*', () => {
    expect(mdToWhatsapp('# H1\n### H3')).toBe('*H1*\n*H3*');
  });

  it('- item -> • item', () => {
    expect(mdToWhatsapp('- primeiro\n- segundo')).toBe('\u2022 primeiro\n\u2022 segundo');
  });

  it('* item (bullet com asterisco) -> • item', () => {
    expect(mdToWhatsapp('* alfa\n* beta')).toBe('\u2022 alfa\n\u2022 beta');
  });

  it('[Google](http://g.com) -> Google: http://g.com', () => {
    expect(mdToWhatsapp('busque no [Google](http://g.com)')).toBe(
      'busque no Google: http://g.com',
    );
  });

  it('tabela markdown vira linhas legíveis (best-effort)', () => {
    const table = ['| Nome | Valor |', '| --- | --- |', '| CDA | 100 |', '| IPTU | 50 |'].join(
      '\n',
    );
    expect(mdToWhatsapp(table)).toBe(['Nome | Valor', 'CDA | 100', 'IPTU | 50'].join('\n'));
  });

  it('remove HTML tags residuais', () => {
    expect(mdToWhatsapp('antes <br> depois <details>x</details>')).toBe('antes  depois x');
  });

  it('texto sem markdown passa intacto', () => {
    const plain = 'Olá! Tudo certo com o link do dashboard.';
    expect(mdToWhatsapp(plain)).toBe(plain);
  });

  it('3+ quebras de linha viram 2', () => {
    expect(mdToWhatsapp('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('cenário real combinado: headings + bold + bullets', () => {
    const input = [
      '## Painel de CDA',
      'Aqui está o link do dashboard **Painel de CDA**:',
      '- O link é **público**',
      '- Expira em 7 dias',
    ].join('\n');
    const out = mdToWhatsapp(input);
    expect(out).not.toContain('**');
    expect(out).toContain('*Painel de CDA*');
    expect(out).toContain('\u2022 O link é *público*');
  });
});
