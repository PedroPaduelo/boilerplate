import { loadAllSkills } from '/workspace/backend-boilerplate/src/modules/agent/skills/index.ts';

async function main() {
  const skills = await loadAllSkills();
  console.log('=== Skills carregadas:', skills.length, '===');
  for (const s of skills) {
    console.log(`  - ${s.slug} (${s.instructions.length} chars instructions)`);
    console.log(`    desc: ${s.description.substring(0, 100)}...`);
  }
  // Verifica as 4 novas
  const expected = [
    'dashboards-fiscalizai-palmas',
    'dashboards-fiscalizai-banco-sch',
    'dashboards-fiscalizai-cobranca',
    'dashboards-fiscalizai-cda-protesto',
  ];
  const slugs = new Set(skills.map(s => s.slug));
  console.log();
  for (const e of expected) {
    console.log(`  ${e}: ${slugs.has(e) ? 'OK' : 'FALTA'}`);
  }
}
main().catch(e => { console.error('ERRO:', e); process.exit(1); });
