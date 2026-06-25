// Tenta rodar uma query com travessão na literal pra confirmar que falha
import { pool } from '/workspace/backend-boilerplate/src/db.js';
const queries = [
  { name: 'OK (sem problematicos)', sql: `SELECT 'texto normal' as ok` },
  { name: 'FALHA (travessao na literal)', sql: `SELECT 'texto — com travessao' as bad` },
  { name: 'FALHA (setas)', sql: `SELECT 'A → B' as bad` },
  { name: 'OK (acentos pt-BR)', sql: `SELECT 'São José do Egito - ação' as ok` },
];

async function main() {
  for (const q of queries) {
    try {
      const res = await pool.query(q.sql);
      console.log(`${q.name}: OK -> ${JSON.stringify(res.rows[0])}`);
    } catch (e: any) {
      console.log(`${q.name}: ERRO -> ${e.message.split('\n')[0]}`);
    }
  }
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
