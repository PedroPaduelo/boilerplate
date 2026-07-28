/**
 * Skills do agente — playbooks em markdown que entram no contexto SOB DEMANDA.
 *
 * ## Duas coisas diferentes moram aqui
 *
 * 1. O **índice** (`renderSkillsIndex`), que é colado no system prompt de TODO
 *    turno: uma linha por skill, para o agente saber o que existe.
 * 2. A **ativação** (`createActivateSkillTool`), que injeta o playbook inteiro
 *    de UMA skill quando ela for necessária.
 *
 * A diferença importa porque o índice é caro: ele paga o preço em cada mensagem
 * do usuário, inclusive nas que não têm nada a ver com construir dashboard. As
 * descrições em disco são manuais inteiros dentro do frontmatter (a maior tem
 * 501 caracteres, cheia de vocabulário de um domínio que a conversa pode nem
 * tocar), e prompt é espaço disputado: o que não é lido no turno atual compete
 * com o que precisa ser seguido nele — as regras de composição da resposta
 * (`docs/composicao-da-resposta.md`). Por isso o índice leva só a PRIMEIRA
 * FRASE de cada descrição; o detalhe está no playbook, a um `activate_skill` de
 * distância. Medido com as skills em disco: 4 481 -> 2 212 caracteres em TODO
 * turno, sem perder de vista nenhuma skill.
 *
 * ## O rodapé de composição
 *
 * O playbook devolvido pela ativação chega DEPOIS do system prompt na janela de
 * contexto, e é grande. Sem lembrete, ele funciona como um prompt novo: o
 * agente passa a falar a língua da skill (nome de bloco, jargão de query,
 * narração de passo) e a resposta volta a ser um relatório técnico. O rodapé em
 * `LEMBRETE_DE_COMPOSICAO` reafirma, junto do playbook, as três regras que a
 * skill costuma atropelar. É restrição estrutural, não instrução repetida no
 * prompt: sai do código toda vez, sem depender de o modelo lembrar.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export interface SkillSummary {
  slug: string;
  name: string;
  description: string;
  instructions: string;
}

const SKILLS_DIR = path.resolve(process.cwd(), '.skills');

/**
 * Teto do resumo de cada skill no índice. 180 caracteres cabem uma frase
 * inteira de identificação ("Sub-skill de referência do CATÁLOGO de blocos")
 * sem carregar a enumeração de tópicos que vem depois dela.
 */
const LIMITE_DO_RESUMO = 180;

/**
 * As regras de composição que o playbook de uma skill não pode revogar.
 *
 * Curto de propósito: é um lembrete, não um segundo system prompt. Cada item
 * corresponde a um erro observado nas respostas reais — bloco técnico exposto
 * ao usuário, escolha de gráfico pelo nome em vez da pergunta, e narração de
 * progresso no corpo da resposta.
 */
const LEMBRETE_DE_COMPOSICAO = [
  '---',
  '',
  'Lembrete (vale acima de qualquer coisa escrita neste playbook):',
  '',
  '- Escolha o bloco pela INTENÇÃO ANALÍTICA da pergunta — evolução no tempo',
  '  pede linha; comparação entre categorias, barra; composição de um todo,',
  '  donut; correlação, dispersão; um número sozinho, KPI. O nome técnico do',
  '  bloco (`kpi`, `bar_chart`, `donut`) é uso interno: NUNCA aparece na',
  '  resposta. Escreva "gráfico de barras", não `bar_chart`.',
  '- Não narre progresso ("agora vou consultar…"). Quem conta o que está',
  '  acontecendo é a trilha de auditoria; seu texto é a RESPOSTA.',
  '- Responda em português brasileiro, começando pela conclusão. O tamanho da',
  '  resposta acompanha o tamanho da pergunta.',
].join('\n');

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of (match[1] || '').split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.+?)\s*$/);
    if (m && m[1]) meta[m[1]] = m[2] ?? '';
  }
  return { meta, body: match[2] || '' };
}

let cachedSkills: SkillSummary[] | null = null;

export async function loadAllSkills(): Promise<SkillSummary[]> {
  if (cachedSkills) return cachedSkills;

  let entries: string[];
  try {
    entries = await readdir(SKILLS_DIR);
  } catch {
    cachedSkills = [];
    return cachedSkills;
  }

  const skills: SkillSummary[] = [];
  for (const file of entries.slice().sort()) {
    if (!file.endsWith('.md')) continue;
    try {
      const raw = await readFile(path.join(SKILLS_DIR, file), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const slug = meta.name || file.replace(/\.md$/, '');
      skills.push({
        slug,
        name: meta.name || slug,
        description: meta.description || '',
        instructions: body.trim(),
      });
    } catch {
      // skip broken files
    }
  }
  cachedSkills = skills;
  return skills;
}

/**
 * Primeira frase da descrição, com teto de tamanho.
 *
 * A quebra procura ponto seguido de MAIÚSCULA para não cortar em abreviação
 * ("ex.: ", "etc.") — o corte errado transformaria a linha do índice em algo
 * incompreensível, que é pior do que a linha longa.
 */
export function resumoDaSkill(description: string): string {
  const limpo = description.replace(/\s+/g, ' ').trim();
  if (limpo === '') return '';

  const fimDaFrase = limpo.search(/\.(?=\s+[A-ZÀ-Ú])/);
  const primeira = fimDaFrase > 0 ? limpo.slice(0, fimDaFrase + 1) : limpo;
  if (primeira.length <= LIMITE_DO_RESUMO) return primeira;
  return `${primeira.slice(0, LIMITE_DO_RESUMO - 1).trimEnd()}…`;
}

/**
 * O índice que vai para o system prompt. Sem skill em disco, devolve string
 * vazia — e o prompt fica exatamente como estava, sem seção órfã.
 */
export function renderSkillsIndex(skills: SkillSummary[]): string {
  if (skills.length === 0) return '';
  const linhas = skills.map((s) => {
    const resumo = resumoDaSkill(s.description);
    return resumo ? `- \`${s.slug}\` — ${resumo}` : `- \`${s.slug}\``;
  });
  return [
    '',
    '## Skills disponíveis',
    '',
    'Playbooks especializados, carregados sob demanda com `activate_skill(slug)`.',
    'Ative no momento em que for usar — em pedido de construção (gráfico,',
    'dashboard, relatório), antes de começar; para responder uma pergunta que se',
    'resolve com uma consulta, não ative nada. Ativar skill é trabalho interno:',
    'não anuncie ao usuário.',
    '',
    ...linhas,
  ].join('\n');
}

export function createActivateSkillTool(skills: SkillSummary[]) {
  const index = new Map(skills.map((s) => [s.slug, s.instructions]));
  const slugs = skills.map((s) => s.slug);

  return tool({
    description:
      'Carrega o playbook completo de uma skill (critérios, passos, armadilhas) pelo slug. ' +
      'Use quando for construir algo que a skill cobre — não para responder pergunta simples. ' +
      'O playbook orienta COMO fazer; as regras de composição da resposta continuam valendo. ' +
      `Skills disponíveis: ${slugs.length > 0 ? slugs.join(', ') : '(nenhuma)'}`,
    inputSchema: z.object({
      slug: z.string().describe('Slug da skill a ativar'),
    }),
    execute: async ({ slug }) => {
      const instructions = index.get(slug);
      if (!instructions) {
        // Em português correto, como todo texto que o modelo lê: o prompt é o
        // exemplo de escrita que ele imita.
        return { error: `Skill "${slug}" não encontrada.`, available: slugs };
      }
      // O lembrete vai DENTRO de `instructions`, não num campo ao lado: campo
      // extra no retorno de tool é fácil de ignorar; texto no fim do playbook é
      // a última coisa que o modelo lê antes de agir.
      return { slug, instructions: `${instructions}\n\n${LEMBRETE_DE_COMPOSICAO}` };
    },
  });
}
