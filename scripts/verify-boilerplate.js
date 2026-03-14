#!/usr/bin/env node

const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function check(condition, success, fail) {
  if (condition) {
    log(`  ✓ ${success}`, 'green');
    return true;
  } else {
    log(`  ✗ ${fail}`, 'red');
    return false;
  }
}

console.log('\n' + '═'.repeat(60));
log('  BOILERPLATE VERIFICATION', 'cyan');
console.log('═'.repeat(60) + '\n');

let passed = 0;
let failed = 0;

// 1. Arquivos raiz
log('1. Arquivos raiz essenciais', 'blue');
['README.md', 'GETTING_STARTED.md', 'CONTRIBUTING.md', 'ARCHITECTURE.md', 'Makefile', 'docker-compose.yml', '.env.example', '.gitignore'].forEach(f => {
  if (check(fs.existsSync(f), f, `${f} ausente`)) passed++; else failed++;
});

// 2. Pastas
log('\n2. Estrutura de pastas', 'blue');
['backend-boilerplate', 'frontend-boilerplate', 'docs', 'docs/guides', 'docs/agente-reports', 'scripts', 'tests/backend', 'tests/frontend'].forEach(d => {
  if (check(fs.existsSync(d) && fs.statSync(d).isDirectory(), `pasta ${d}`, `pasta ${d} ausente`)) passed++; else failed++;
});

// 3. Scripts
log('\n3. Scripts auxiliares', 'blue');
['scripts/setup.sh', 'scripts/seed.js', 'scripts/healthcheck.js', 'scripts/backup.sh', 'scripts/deploy.sh'].forEach(s => {
  if (check(fs.existsSync(s), s, `${s} ausente`)) passed++; else failed++;
});

// 4. Docs HTML
log('\n4. Documentação HTML', 'blue');
const guides = fs.readdirSync('docs/guides').filter(f => f.endsWith('.html'));
if (check(guides.length >= 15, `${guides.length} páginas em guides/`, `menos de 15 páginas (${guides.length})`)) passed++; else failed++;
if (check(fs.existsSync('docs/index.html'), 'docs/index.html', 'docs/index.html ausente')) passed++; else failed++;

// 5. Backend package.json
log('\n5. Backend (Fastify)', 'blue');
try {
  const bp = JSON.parse(fs.readFileSync('backend-boilerplate/package.json', 'utf8'));
  if (check(bp.name && bp.name.includes('backend'), 'nome backend', 'nome backend incorreto')) passed++; else failed++;
  const deps = bp.dependencies || {};
  if (check(deps.fastify, 'fastify', 'fastify não encontrado')) passed++; else failed++;
  if (check(deps.prisma, 'prisma', 'prisma não encontrado')) passed++; else failed++;
  if (check(deps['@fastify/jwt'], '@fastify/jwt', '@fastify/jwt não encontrado')) passed++; else failed++;
} catch (e) {
  log('  ✗ backend package.json inválido', 'red'); failed += 3;
}

// 6. Frontend package.json
log('\n6. Frontend (React+Vite)', 'blue');
try {
  const fp = JSON.parse(fs.readFileSync('frontend-boilerplate/package.json', 'utf8'));
  if (check(fp.name && fp.name.includes('frontend'), 'nome frontend', 'nome frontend incorreto')) passed++; else failed++;
  const deps = fp.dependencies || {};
  if (check(deps.react, 'react', 'react não encontrado')) passed++; else failed++;
  if (check(deps['react-dom'], 'react-dom', 'react-dom não encontrado')) passed++; else failed++;
  if (check(deps.vite || fp.devDependencies?.vite, 'vite', 'vite não encontrado')) passed++; else failed++;
  if (check(deps['@radix-ui/react-dialog'], 'shadcn/ui dialog', 'shadcn/ui dialog não encontrado')) passed++; else failed++;
} catch (e) {
  log('  ✗ frontend package.json inválido', 'red'); failed += 5;
}

// 7. Prisma schema
log('\n7. Prisma Schema', 'blue');
if (check(fs.existsSync('backend-boilerplate/prisma/schema.prisma'), 'schema.prisma', 'schema.prisma ausente')) passed++; else failed++;
const schema = fs.readFileSync('backend-boilerplate/prisma/schema.prisma', 'utf8');
if (check(schema.includes('model User'), 'model User', 'model User ausente')) passed++; else failed++;
if (check(schema.includes('enum UserRole'), 'enum UserRole', 'enum UserRole ausente')) passed++; else failed++;

// 8. Docker compose
log('\n8. Docker Compose', 'blue');
const dc = fs.readFileSync('docker-compose.yml', 'utf8');
if (check(dc.includes('postgres:'), 'serviço postgres', 'postgres não definido')) passed++; else failed++;
if (check(dc.includes('redis:'), 'serviço redis', 'redis não definido')) passed++; else failed++;
if (check(dc.includes('opensearch:') || dc.includes('opensearch'), 'serviço opensearch', 'opensearch não definido')) passed++; else failed++;

// 9. Testes estrutura
log('\n9. Testes estrutura', 'blue');
if (check(fs.existsSync('tests/backend/health.test.ts'), 'backend health.test.ts', 'health test ausente')) passed++; else failed++;
if (check(fs.existsSync('tests/frontend/App.test.tsx'), 'frontend App.test.tsx', 'App test ausente')) passed++; else failed++;

// 10. Makefile targets
log('\n10. Makefile principais', 'blue');
const mk = fs.readFileSync('Makefile', 'utf8');
['install', 'dev', 'services-up', 'db-migrate', 'db-seed', 'build', 'test'].forEach(t => {
  if (check(mk.includes(`${t}:`) || mk.includes(`.PHONY: ${t}`), `target ${t}`, `target ${t} ausente`)) passed++; else failed++;
});

// Summary
console.log('\n' + '─'.repeat(60));
if (failed === 0) {
  log(`  ✅ TODOS OS ${passed} CHECKS PASSARAM!`, 'green');
  log('\n  Próximo passo: cp .env.example .env && make services-up && make dev', 'cyan');
} else {
  log(`  Resultado: ${passed} OK, ${failed} falhas`, 'yellow');
}
console.log('─'.repeat(60) + '\n');

process.exit(failed === 0 ? 0 : 1);
