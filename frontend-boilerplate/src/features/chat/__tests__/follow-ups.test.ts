/**
 * Contrato de `deriveFollowUps` — a parte da feature onde mora o risco.
 *
 * O caso que importa é o negativo: uma lista qualquer no fim da resposta (as
 * tabelas encontradas, os maiores devedores) NÃO é uma oferta de continuação, e
 * transformá-la em botão poria na boca do agente algo que ele não disse. Por
 * isso metade dos casos aqui verifica que a função devolve vazio.
 */
import { describe, it, expect } from 'vitest';
import { deriveFollowUps } from '../lib/follow-ups';

describe('deriveFollowUps', () => {
  it('extrai a oferta de próximos passos que fecha a resposta', () => {
    const answer = [
      'Encontrei 128 lançamentos acima da média.',
      '',
      'Se quiser, posso te ajudar a:',
      '- criar um dashboard com esses números',
      '- analisar a evolução mês a mês',
      '- exportar a lista completa',
      '',
      'Qual desses interessa?',
    ].join('\n');

    expect(deriveFollowUps(answer)).toEqual([
      'Criar um dashboard com esses números',
      'Analisar a evolução mês a mês',
      'Exportar a lista completa',
    ]);
  });

  it('aceita lista numerada sob um cabeçalho de próximos passos', () => {
    const answer = [
      'A arrecadação caiu 12% em março.',
      '',
      '## Próximos passos',
      '1. Comparar março com o mesmo mês de 2025',
      '2. Detalhar a queda por município',
    ].join('\n');

    expect(deriveFollowUps(answer)).toEqual([
      'Comparar março com o mesmo mês de 2025',
      'Detalhar a queda por município',
    ]);
  });

  it('limpa a sintaxe do markdown mas preserva nome de tabela', () => {
    const answer = [
      'Posso seguir por aqui:',
      '- **Criar um gráfico** da tabela `nota_fiscal`.',
      '- Auditar duplicidades em nota_fiscal;',
    ].join('\n');

    expect(deriveFollowUps(answer)).toEqual([
      'Criar um gráfico da tabela nota_fiscal',
      'Auditar duplicidades em nota_fiscal',
    ]);
  });

  it('não inventa: lista sem oferta não vira sugestão', () => {
    const answer = [
      'As tabelas da conexão Postgres são:',
      '- nota_fiscal',
      '- empenho',
      '- fornecedor',
    ].join('\n');

    expect(deriveFollowUps(answer)).toEqual([]);
  });

  it('ignora lista dentro de bloco de código', () => {
    const answer = [
      'Rodei esta consulta e posso repetir:',
      '',
      '```sql',
      '-- passos',
      '-- 1. filtra o ano',
      '-- 2. agrupa por mês',
      '```',
    ].join('\n');

    expect(deriveFollowUps(answer)).toEqual([]);
  });

  it('uma oferta só não vira faixa de escolhas', () => {
    const answer = ['Posso continuar com:', '- criar um dashboard'].join('\n');

    expect(deriveFollowUps(answer)).toEqual([]);
  });

  it('corta em quatro e descarta repetidas', () => {
    const answer = [
      'Quer que eu faça algum destes?',
      '- criar um dashboard',
      '- Criar um dashboard',
      '- analisar a evolução',
      '- exportar a lista',
      '- auditar duplicidades',
      '- comparar com o ano anterior',
    ].join('\n');

    expect(deriveFollowUps(answer)).toEqual([
      'Criar um dashboard',
      'Analisar a evolução',
      'Exportar a lista',
      'Auditar duplicidades',
    ]);
  });

  it('texto sem lista nenhuma devolve vazio', () => {
    expect(deriveFollowUps('A média mensal é de R$ 128 mil.')).toEqual([]);
    expect(deriveFollowUps('')).toEqual([]);
  });
});
