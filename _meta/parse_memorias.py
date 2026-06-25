import re, json, sys

with open('/workspace/uploads/hazmc-memorias.txt', 'r', encoding='utf-8') as f:
    text = f.read()

sections = text.split('memória 🟢 CANÔNICA')

# Marcadores fortes de fim (na ordem de confiabilidade):
# 1. "← voltar ao índice" (âncora que precede próximo título)
# 2. NOVA memória (próximo título): linha com "⚠️"/"🔴"/"📌"/"🟡" ou "BUG CRÍTICO"/"ERRO"/"DECISÃO"/"REVISÃO"/"RESUMO"
#    PRECEDIDA de linha em branco, SEGUIDA de linha cmq...
#
# Estratégia: detectar "fim" pelo padrão: \n\s*\n[⚠️🔴📌🟡].*\n\s*cmq[a-z0-9]+  OU  ← voltar

# Padrão mais robusto: fim = "← voltar" OU nova memória "⚠️ ARMADILHA"/"⚠️ CORREÇÃO"/
# "BUG CRÍTICO"/"DECISÃO DO USUÁRIO"/"REVISÃO METODOLÓGICA"/"RESUMO OPERACIONAL"/
# "DIRETRIZ DE FORMATO"/"ERRO NUMÉRICO"/"FÓRMULA CANÔNICA"/"REGRAS DURAS"/
# "ESTOQUE"/"INVENTÁRIO"/"STATUS/SITUAÇÃO"/"Backend"/"Cold cache"/"VALIDAÇÃO OBRIGATÓRIA"/
# "SNAPSHOT ESTRUTURAL"/"Padrões SQL"/"JOIN LIVRO1"/"Inconsistência de dados"/"DÍVIDA"/"Dashboard"

# A heurística mais segura: o END é o "← voltar ao índice" + o TÍTULO da próxima memória.
# Vamos identificar onde "← voltar" aparece e cortar logo antes.

END_RE = re.compile(r'← voltar ao índice', re.MULTILINE)

def extract_body_v2(s):
    """Corta no PRIMEIRO '← voltar ao índice' se existir; senão usa a heurística antiga."""
    s = s.lstrip('\n')
    m = END_RE.search(s)
    if m:
        # Corta tudo a partir do "← voltar" — mas mantém até a linha antes
        before = s[:m.start()]
        # Pode ter conteúdo depois do "← voltar" antes do próximo marcador
        return before.rstrip()
    # Sem "← voltar": usar heurística antiga
    FALLBACK_RE = re.compile(r'\n\s*\n(?:memória\b|⚠️ ARMADILHA|⚠️ CORREÇÃO|⚠️ BUG|BUG CRÍTICO|\Z)', re.MULTILINE)
    m2 = FALLBACK_RE.search(s)
    if m2:
        return s[:m2.start()].strip()
    return s.strip()

def extract_title(s):
    """Última linha não-vazia antes do split point."""
    lines = [l.rstrip() for l in s.split('\n') if l.strip()]
    return lines[-1].strip() if lines else ''

def clean_title(t):
    """Remove sufixo de memory id."""
    return re.sub(r'\s+cmq[a-z0-9]{10,}\s*$', '', t).strip()

memories = []
for i in range(1, len(sections)):
    title = clean_title(extract_title(sections[i-1]))
    body = extract_body_v2(sections[i])
    if len(body) < 50:
        continue
    memories.append({'idx': i, 'title': title, 'body': body})

print(f'Total de memórias extraídas: {len(memories)}', file=sys.stderr)

# Casos especiais: para #35, o título real está na primeira linha do body
# (o título extraído do header é "← voltar ao índice" — lixo)
for m in memories:
    if m['title'].startswith('← voltar'):
        # Pega a primeira linha do body
        first_line = m['body'].split('\n')[0].strip()
        if first_line:
            m['title'] = first_line
            m['body'] = '\n'.join(m['body'].split('\n')[1:]).lstrip()

# Salva
with open('/workspace/_meta/memories.json', 'w', encoding='utf-8') as f:
    json.dump(memories, f, ensure_ascii=False, indent=2)

# Estatísticas
for m in memories:
    print(f"[{m['idx']:02d}] {len(m['body']):>6} chars - {m['title'][:80]}", file=sys.stderr)
