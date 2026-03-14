const fs = require('fs');
const path = require('path');

const reportsDir = '/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/docs/agente-reports';
const guidesDir = '/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/docs/guides';
const templatePath = './template-base.html';

const titles = [
  'Arquitetura Geral',
  'Modelagem de Banco',
  'Autenticação e Segurança',
  'API REST',
  'WebSockets',
  'Filas e Jobs',
  'Cache e Redis',
  'Search e Indexação',
  'Frontend: Estrutura',
  'Auth Frontend',
  'Features',
  'UI Components',
  'Segurança Backend',
  'Serviços e Regras',
  'Integração e Deploy'
];

function simplesMarkdownToHtml(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/(<\/li>\n<li>)+/g, '</li><li>')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, match => {
      if (match.trim() === '') return '';
      if (match.match(/^<h[1-6]>/) || match.match(/^<ul>/) || match.match(/^<pre>/) || match.match(/^<blockquote>/) || match.match(/^<img/) || match.match(/^<a/)) return match;
      return `<p>${match}</p>`;
    })
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/<\/h[1-6]><\/p>/g, '</h$1>')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p>(<pre>)/g, '$1')
    .replace(/<\/pre><\/p>/g, '</pre>')
    .replace(/<p>(<blockquote>)/g, '$1')
    .replace(/<\/blockquote><\/p>/g, '</blockquote>');
  return html;
}

const template = fs.readFileSync(templatePath, 'utf8');

for (let i = 1; i <= 15; i++) {
  const num = i.toString().padStart(2, '0');
  const mdPath = path.join(reportsDir, `${num}-${titles[i-1].toLowerCase().replace(/[^a-z]/g, '-').replace(/-+/g, '-')}.md`);
  const outPath = path.join(guidesDir, `${num}-${titles[i-1].toLowerCase().replace(/[^a-z]/g, '-').replace(/-+/g, '-')}.html`);

  if (!fs.existsSync(mdPath)) {
    console.error(`Missing: ${mdPath}`);
    continue;
  }

  let md = fs.readFileSync(mdPath, 'utf8');
  let content = simplesMarkdownToHtml(md);

  // Post-process for tables: wrap tables that start with | in proper HTML
  content = content.replace(/(<p>)?\|(.+?)\|(<\/p>)?/g, (match) => {
    const lines = match.split('\n').filter(l => l.trim().startsWith('|'));
    if (lines.length >= 2) {
      let headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim());
      let rows = lines.slice(2).map(line => line.split('|').filter(c => c.trim()).map(c => c.trim()));
      let html = '<table><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      for (const row of rows) {
        html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
      }
      html += '</tbody></table>';
      return html;
    }
    return match;
  });

  const page = template
    .replace('<title>Boilerplate — Docs</title>', `<title>${titles[i-1]} — Boilerplate Docs</title>`)
    .replace('<!-- CONTEÚDO SERÁ INSERIDO AQUI -->', content);

  fs.writeFileSync(outPath, page);
  console.log(`Created: ${outPath}`);
}

console.log('Done.');
