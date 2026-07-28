/**
 * O ÍNDICE de skills — a parte que é colada no system prompt de todo turno.
 *
 * O que está sob teste é o corte: a descrição em disco é um manual inteiro
 * (a maior tem 501 caracteres) e o índice paga esse preço em CADA mensagem do
 * usuário, inclusive nas que não têm nada a ver com dashboard. Prompt é espaço
 * disputado — o que não é lido no turno compete com as regras de composição da
 * resposta, que precisam ser seguidas nele.
 *
 * Puro: nada aqui lê disco, sobe agente ou chama modelo.
 */
import { renderSkillsIndex, resumoDaSkill, type SkillSummary } from '@/modules/agent/skills/index';

function skill(slug: string, description: string): SkillSummary {
  return { slug, name: slug, description, instructions: '# playbook' };
}

describe('resumo da descrição', () => {
  it('corta na primeira frase — o resto está no playbook', () => {
    expect(
      resumoDaSkill(
        'Sub-skill de referência do CATÁLOGO de blocos (43 tipos). Inclui o mapa completo.',
      ),
    ).toBe('Sub-skill de referência do CATÁLOGO de blocos (43 tipos).');
  });

  it('não corta em abreviação: o ponto de "ex.:" não termina frase', () => {
    const resumo = resumoDaSkill('Guia de layout, ex.: grade de 12 colunas e containers.');
    expect(resumo).toBe('Guia de layout, ex.: grade de 12 colunas e containers.');
  });

  it('frase única e longa demais é truncada com reticências', () => {
    const longa = `Sub-skill 1 do banco ${'x'.repeat(300)}`;
    const resumo = resumoDaSkill(longa);
    expect(resumo.length).toBeLessThanOrEqual(180);
    expect(resumo.endsWith('…')).toBe(true);
  });

  it('descrição vazia não vira lixo no índice', () => {
    expect(resumoDaSkill('   ')).toBe('');
  });
});

describe('índice injetado no prompt', () => {
  it('sem skills em disco, não existe seção órfã', () => {
    expect(renderSkillsIndex([])).toBe('');
  });

  it('lista TODAS as skills, cada uma em uma linha, sem perder nenhuma', () => {
    const indice = renderSkillsIndex([
      skill('construtor-dashboards', 'Skill MESTRA. Detalhe que fica no playbook.'),
      skill('dashboards-query', 'Geração de SQL. Detalhe que fica no playbook.'),
    ]);
    expect(indice).toContain('- `construtor-dashboards` — Skill MESTRA.');
    expect(indice).toContain('- `dashboards-query` — Geração de SQL.');
    expect(indice).not.toContain('Detalhe que fica no playbook');
  });

  it('manda ativar sob demanda e em silêncio — não anunciar é regra do prompt', () => {
    const indice = renderSkillsIndex([skill('x', 'Uma skill.')]);
    expect(indice).toContain('sob demanda');
    expect(indice).toContain('não anuncie ao usuário');
  });

  it('está em português com acento — o prompt é o exemplo de escrita que o modelo imita', () => {
    const indice = renderSkillsIndex([skill('x', 'Uma skill.')]);
    expect(indice).toContain('## Skills disponíveis');
  });
});
