const fs = require('fs');
const path = require('path');

const reportsDir = './agente-reports';
const guidesDir = './guides';
const templatePath = './template-base.html';

const files = [
  { num: '01', title: 'Arquitetura Geral', md: '01-arquitetura-geral.md' },
  { num: '02', title: 'Modelagem de Banco', md: '02-modelagem-banco.md' },
  { num: '03', title: 'Autenticação e Segurança', md: '03-autenticacao-seguranca.md' },
  { num: '04', title: 'API REST', md: '04-api-endpoints.md' },
  { num: '05', title: 'WebSockets', md: '05-websockets.md' },
  { num: '06', title: 'Filas e Jobs', md: '06-filas-jobs.md' },
  { num: '07', title: 'Cache e Redis', md: '07-cache-redis.md' },
  { num: '08', title: 'Search e Indexação', md: '08-search-indexacao.md' },
  { num: '09', title: 'Frontend: Estrutura', md: '09-frontend-estrutura.md' },
  { num: '10', title: 'Auth Frontend', md: '10-auth-frontend.md' },
  { num: '11', title: 'Features', md: '11-features.md' },
  { num: '12', title: 'UI Components', md: '12-ui-shared.md' },
  { num: '13', title: 'Segurança Backend', md: '13-seguranca-backend.md' },
  { num: '14', title: 'Serviços e Regras', md: '14-servicos-negocio.md' },
  { num: '15', title: 'Integração e Deploy', md: '15-integracao-deploy.md' }
];

const template = fs.readFileSync(templatePath, 'utf8');

function mdToHtml(md) {
  // Not very robust, but good enough for these reports
  return md
    .replace(/\n## (.*)/g, '\n<h2>$1</h2>')
    .replace(/\n### (.*)/g, '\n<h3>$1</h3>')
    .replace(/\n#### (.*)/g, '\n<h4>$1</h4>')
    .replace(/^# (.*)/m, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, (m) => {
      if (m.trim() === '') return '';
      if (m.startsWith('<h') || m.startsWith('<ul') || m.startsWith('<ol') || m.startsWith('<pre') || m.startsWith('<blockquote') || m.startsWith('<img') || m.startsWith('<a') || m.startsWith('<table') || m.startsWith('<tr') || m.startsWith('<th') || m.startsWith('<td')) return m;
      return `<p>${m}</p>`;
    })
    .replace(/<\/p><h/g, '<h')
    .replace(/<\/p><ul/g, '<ul')
    .replace(/<\/p><pre/g, '<pre')
    .replace(/<\/p><blockquote/g, '<blockquote')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<p><\/ul><\/p>/g, '</ul>')
    .replace(/<p><pre>/g, '<pre>')
    .replace(/<p><\/pre><\/p>/g, '</pre>')
    .replace(/<ul>\s*<li>/g, '<ul><li>')
    .replace(/<\/li>\s*<\/ul>/g, '</ul>');
}

for (const f of files) {
  const mdPath = path.join(reportsDir, f.md);
  const outPath = path.join(guidesDir, `${f.num}-${f.title.toLowerCase().replace(/[^a-z]/g, '-').replace(/-+/g, '-')}.html`);
  if (!fs.existsSync(mdPath)) {
    console.error(`Missing: ${mdPath}`);
    continue;
  }
  let md = fs.readFileSync(mdPath, 'utf8');
  let content = mdToHtml(md);

  // Convert markdown tables (| col | col |) to HTML tables
  // Simple: detect lines with pipes and group into tables
  content = content.replace(/(<p>)?(\|.+\|)(<\/p>)?/g, (match, before, tableLine, after, offset, string) => {
    const lines = [];
    let pos = offset;
    while (pos < string.length) {
      const lineMatch = string.slice(pos).match(/(\|.*\|)/);
      if (!lineMatch) break;
      lines.push(lineMatch[1]);
      pos += lineMatch.index + lineMatch[0].length + 1; // +1 for newline
    }
    if (lines.length >= 2) {
      const rows = lines.map(l => l.split('|').filter(c => c.trim()).map(c => c.trim()));
      // Heuristic: if second row has dashes, it's a header separator
      let startIdx = 0;
      if (rows.length > 1 && rows[1].some(cell => cell.match(/^[-:]+$/))) {
        startIdx = 1; // skip separator
      }
      const header = rows[0];
      const bodyRows = rows.slice(startIdx + 1);
      let html = '<table><thead><tr>';
      for (const h of header) html += `<th>${h}</th>`;
      html += '</tr></thead><tbody>';
      for (const row of bodyRows) {
        html += '<tr>';
        for (const cell of row) html += `<td>${cell}</td>`;
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html;
    }
    return match;
  });

  const page = template
    .replace('<title>Boilerplate — Docs</title>', `<title>${f.title} — Boilerplate Docs</title>`)
    .replace('<!-- CONTEÚDO SERÁ INSERIDO AQUI -->', content);

  fs.writeFileSync(outPath, page);
  console.log(`Created: ${outPath}`);
}

console.log('All done');
