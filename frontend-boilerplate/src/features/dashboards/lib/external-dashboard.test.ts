import { describe, it, expect } from 'vitest';
import {
  externalUrlHost,
  isExternalDashboard,
  isSafeExternalUrl,
  normalizeExternalUrl,
} from './external-dashboard';

describe('isExternalDashboard', () => {
  it('reconhece pelo endereço preenchido', () => {
    expect(isExternalDashboard({ externalUrl: 'https://bi.exemplo.gov.br' })).toBe(true);
  });

  it('dashboard desta plataforma não é externo (null, undefined ou vazio)', () => {
    expect(isExternalDashboard({ externalUrl: null })).toBe(false);
    expect(isExternalDashboard({})).toBe(false);
    // String vazia contaria como "tem endereço" num teste ingênuo de truthiness
    // invertido — e a linha viraria um link para lugar nenhum.
    expect(isExternalDashboard({ externalUrl: '' })).toBe(false);
  });
});

describe('normalizeExternalUrl', () => {
  it('assume https quando o esquema falta (o erro mais comum ao colar)', () => {
    expect(normalizeExternalUrl('analytics.bi.fiscaliza.cloud')).toBe(
      'https://analytics.bi.fiscaliza.cloud',
    );
    expect(normalizeExternalUrl('  bi.exemplo.gov.br/relatorio/12  ')).toBe(
      'https://bi.exemplo.gov.br/relatorio/12',
    );
  });

  it('preserva o que já tem esquema — inclusive http', () => {
    expect(normalizeExternalUrl('http://interno.local/painel')).toBe(
      'http://interno.local/painel',
    );
    expect(normalizeExternalUrl('https://x.com')).toBe('https://x.com');
  });

  it('NÃO maquia esquema perigoso com https (quem recusa é a validação)', () => {
    expect(normalizeExternalUrl('javascript:alert(1)')).toBe('javascript:alert(1)');
  });

  it('vazio continua vazio', () => {
    expect(normalizeExternalUrl('   ')).toBe('');
  });
});

describe('isSafeExternalUrl', () => {
  it('aceita http e https', () => {
    expect(isSafeExternalUrl('https://bi.exemplo.gov.br')).toBe(true);
    expect(isSafeExternalUrl('http://interno.local/painel')).toBe(true);
  });

  it('recusa esquema executável ou embutido — o link vira href de verdade', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>')).toBe(false);
    expect(isSafeExternalUrl('/dashboards/1')).toBe(false);
    expect(isSafeExternalUrl('')).toBe(false);
  });
});

describe('externalUrlHost', () => {
  it('extrai o domínio para a tela dizer para onde o clique leva', () => {
    expect(externalUrlHost('https://analytics.bi.fiscaliza.cloud/rel/1?a=2')).toBe(
      'analytics.bi.fiscaliza.cloud',
    );
  });

  it('endereço impossível de interpretar volta como está (não quebra a linha)', () => {
    expect(externalUrlHost('nao-e-url')).toBe('nao-e-url');
  });
});
