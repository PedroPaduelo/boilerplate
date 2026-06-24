/**
 * Skills do agent — lê skills de duas fontes:
 * 1. Arquivos .md em backend-boilerplate/.skills/ (formato frontmatter)
 * 2. Se não houver, retorna lista vazia (o agent funciona sem skills)
 *
 * Futuro: pode ler da API de skills da organização.
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

export function renderSkillsIndex(skills: SkillSummary[]): string {
  if (skills.length === 0) return '';
  const lines = skills.map((s) => `- \`${s.slug}\` — ${s.description}`);
  return [
    '',
    '## Skills disponiveis',
    '',
    'Voce tem skills especializadas que podem ser ativadas quando relevantes.',
    'Cada skill traz um playbook completo (criterios, passos, formato de resposta).',
    'Ative uma skill com a tool `activate_skill(slug)` ANTES de comecar a executar.',
    '',
    ...lines,
  ].join('\n');
}

export function createActivateSkillTool(skills: SkillSummary[]) {
  const index = new Map(skills.map((s) => [s.slug, s.instructions]));
  const slugs = skills.map((s) => s.slug);

  return tool({
    description:
      'Ativa uma skill pelo slug. Retorna o playbook completo (instrucoes detalhadas). ' +
      'Use quando a tarefa do usuario corresponder a uma skill. ' +
      `Skills disponiveis: ${slugs.length > 0 ? slugs.join(', ') : '(nenhuma)'}`,
    inputSchema: z.object({
      slug: z.string().describe('Slug da skill a ativar'),
    }),
    execute: async ({ slug }) => {
      const instructions = index.get(slug);
      if (!instructions) {
        return { error: `Skill "${slug}" nao encontrada.`, available: slugs };
      }
      return { slug, instructions };
    },
  });
}
