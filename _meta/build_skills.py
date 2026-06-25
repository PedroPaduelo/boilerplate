"""
Gera 4 arquivos .md em /workspace/backend-boilerplate/.skills/ a partir das memórias
extraídas em /workspace/_meta/memories.json.

REGRAS DE SAÍDA (T7 + briefing T11):
- Frontmatter: 'name' (slug) + 'description' (curta, max 250 chars)
- Body: instruções em Markdown
- ZERO tipográficos problemáticos: travessão, en-dash, reticências, seta, bullet, aspas curvas
- Emojis de status (⚠✅❌✓🔴🟡💡) viram palavras curtas entre colchetes
- U+FE0F (VS-16) removido
- Acentos pt-BR PRESERVADOS (LATIN1-safe)
- Símbolos matemáticos (=, !=, <=, >=, etc) ASCII
- Box drawing substituído
"""
import json, re, sys
from pathlib import Path

SANITIZE_MAP = {
    '—': '-',     # em dash
    '–': '-',     # en dash
    '…': '...',   # reticências
    '→': '->',    # seta
    '•': '*',     # bullet
    '“': '"',     # aspas curvas esq
    '”': '"',     # aspas curvas dir
    '‘': "'",     # aspas curvas esq
    '’': "'",     # aspas curvas dir
    '≠': '!=',    # not equal
    '≥': '>=',    # >=
    '≤': '<=',    # <=
    '⇒': '=>',    # implies
    '↔': '<->',   # bi-conditional
    '⇄': '<=>',   # bi-conditional
    '⟺': '<=>',   # bi-conditional
    '≈': '~=',    # approx
    '∩': '^',     # intersection
    '∉': '!in',   # not in
    '−': '-',     # minus
    'Σ': 'soma',  # sigma
    'Δ': 'delta', # delta
    '─': '-',     # box horizontal
    '│': '|',     # box vertical
    '└': '+',     # box corner
    '►': '->',    # pointer
    '⚠': '[!]',   # warning
    '✅': '[OK]',  # check
    '❌': '[X]',   # cross
    '✓': 'OK',    # check
    '🔴': '[REVISADA]',  # red circle
    '🟡': '[REVER]',     # yellow circle
    '💡': '[DICA]',      # lightbulb
    '🟢': '[OK]',        # green circle
}

def sanitize(text):
    text = text.replace('\uFE0F', '')
    for k, v in SANITIZE_MAP.items():
        text = text.replace(k, v)
    # Remove 'memória' (sozinha no fim) e blocos de resumo duplicado
    return text

def clean_body(body):
    """Remove o 'resumo' final duplicado e o marcador 'memória' trailing."""
    # Padrão: depois do último bloco de conteúdo útil, vem:
    # "...\n\nmemória\n\n<resumo>\n\ncopiar" ou só "...copiar"
    # Corta em 'copiar' que vem no final do resumo duplicado
    lines = body.split('\n')
    # Encontra o último "copiar" (que marca fim de bloco de código)
    last_copiar = -1
    for i, line in enumerate(lines):
        if line.strip() == 'copiar':
            last_copiar = i
    if last_copiar >= 0 and last_copiar < len(lines) - 1:
        # Tem conteúdo depois de "copiar" — geralmente é a parte do resumo
        after = '\n'.join(lines[last_copiar+1:]).strip()
        if 'memória' in after.lower() and len(after) < len(body) * 0.6:
            # É o resumo duplicado, descarta
            body = '\n'.join(lines[:last_copiar]).rstrip()
    # Remove "memória" sozinha
    body = re.sub(r'\n\s*mem[oó]ria\s*\n', '\n', body).strip()
    return body

def build_skill(slug, description, sections):
    """sections: lista de (memoria_dict, clean_body_text)"""
    parts = [
        f'---\n',
        f'name: {slug}\n',
        f'description: {description}\n',
        f'---\n',
        '\n',
    ]
    return ''.join(parts) + '\n'.join(sections)

# === MAIN ===
with open('/workspace/_meta/memories.json') as f:
    memories = json.load(f)

# Sanitiza TODOS os bodies
for m in memories:
    m['body_clean'] = clean_body(sanitize(m['body']))
    m['title_clean'] = sanitize(m['title'])

# Output dir
OUT = Path('/workspace/backend-boilerplate/.skills')
OUT.mkdir(parents=True, exist_ok=True)

# === MESTRA: dashboards-fiscalizai-palmas ===
mestra_sections = []

# Intro
mestra_sections.append("""# Banco SCH (Palmas) - Skill MESTRA

> Esta e a skill mestra do banco SCH (Palmas) - Prefeitura Municipal de Palmas (TO).
> E o dataset canonico do FiscalizaIA: receita tributaria, DUAM, CDA, protesto,
> parcelamentos, PESSOA, SIGFACIL, CONTROLE_PROTESTO_ITENS, LIVRO1, ARQ1033.
>
> Use esta mestra para entender o MODELO, as ARMADILHAS CRITICAS e a MAQUINA DE
> ESTADOS do credito tributario municipal. Para o detalhe de cada frente, abra
> a sub-skill especializada pelo slug (a IA pode ativar ate 1 skill por turno).

## 0. Indice das sub-skills

| Frente | Sub-skill (slug) | Cobre |
|---|---|---|
| Schema, encoding, qualidade de dado | `dashboards-fiscalizai-banco-sch` | PESSOA, SIGFACIL, INSC_MUNICIPAL, LATIN1, snapshots, decisoes estruturais |
| Funil, DUAM, parcelamentos, inadimplencia | `dashboards-fiscalizai-cobranca` | N1/N2/N3, DUAM_IT, SMCALCREPAC, REFIS, inadimplencia por safra, maturação |
| CDA, protesto, divida ativa, eficacia de canais | `dashboards-fiscalizai-cda-protesto` | LIVRO1, ARQ1033, PROC_FORUM, Certidao, Demonstrativo, Taxa de Recuperacao |

## 1. Encoding do banco: LATIN1 (regra #1 - inegociavel)

O schema `SCH` (e quase todo o banco da Prefeitura de Palmas) e `ENCODING 'LATIN1'`,
NAO UTF-8. Isso significa:

- Caracteres ASCII (a-z, A-Z, 0-9, pontuacao basica, aspas retas) sao seguros.
- Acentos pt-BR (`a e i o u a e i o u a o c a a e o`) sao validos em LATIN1.
- **PROIBIDO** em literais SQL: travessao `-`, en-dash `-`, reticencias `...`,
  seta `->`, aspas curvas `" "`, bullet `*` e simbolos matematicos
  (`!=`, `>=`, `<=`, `~=`, `^`, etc) - eles quebram com
  `has no equivalent in encoding "LATIN1"`.

Em qualquer query que a IA escrever para rodar contra o banco SCH, use SEMPRE:
- aspas retas `"texto"` (NUNCA aspas curvas),
- `-` em vez de travessao/en-dash,
- `...` em vez de reticencias Unicode,
- `->` em vez de seta Unicode,
- `!=`, `>=`, `<=` em vez dos simbolos `≠ ≥ ≤`.

Esta regra vale para LITERALS dentro de SQL. Nos arquivos de SKILL.md `.skills/`,
tambem aplicamos (a IA pode COPIAR trechos da skill para queries).

## 2. Maquina de estados do credito tributario (valida no banco)

Toda DUAM percorre um ciclo canonico. Este e o modelo conceitual que TODA query
do FiscalizaIA precisa respeitar:

```
LANCAMENTO  ->  PAGO  ->  LIQUIDADO
     |             |          ^
     v             v          |
 PARCELADO   ->  DIVIDA ATIVA (DA)
                  |
                  +--> COM CDA (certidao da divida ativa - titulo executivo)
                  +--> COM PROTESTO (certidao de protesto em cartorio)
                  +--> COM EXECUCAO FISCAL (LIVRO1.PROC_FORUM)
```

Definicoes (c/ origem no banco):
- **Lancamento** = DUAM/DUAM_IT com `DATA_PGTO IS NULL AND DATA_DIV_ATI IS NULL`.
  (NAO migrou para DA; NAO foi pago.)
- **Pago** = `DATA_PGTO IS NOT NULL` (parcela ou total).
- **Liquidado** = `DATA_PGTO IS NOT NULL` E `FLAG_PG_TOTAL = 1` (documento inteiro).
  ATENCAO: FLAG_PG_TOTAL e flag de DOCUMENTO, NAO garante todas as DUAM_IT
  quitadas (ver `dashboards-fiscalizai-cobranca`).
- **Divida Ativa (DA)** = `DATA_DIV_ATI IS NOT NULL`. E o ESTADO administrativo.
  NAO significa "tem CDA emitida" (CDA e o documento; ver CDA x DA).
- **Com CDA** = existe registro em `LIVRO1` com aquela `INSCRICAO` (que e o
  numero da CDA no formato `NR_LIVRO.PAG.LINHA.DUAM_IT.PARCELA`, ex:
  `20180.100.1.2443773.0`).
- **Com Protesto** = existe registro em `ARQ1033` com `NR_CERTIDAO` (formato
  numerico, ex: `20180015730`). NR_CERTIDAO e diferente de LIVRO1.INSCRICAO.
- **Execucao Fiscal** = `LIVRO1.PROC_FORUM` nao nulo (mas aceita 5+ formatos +
  string sentinela - ver sub-skill CDA/Protesto).

## 3. Armadilhas criticas (resumo executivo - O QUE NAO ESQUECER)

Lista compacta das 15 armadilhas mais criticas. Cada uma esta expandida em
alguma sub-skill:

1. **INSC_MUNICIPAL = 0 no join PESSOA x SIGFACIL_EMPRESA** - 123.613 registros
   orfaos quebram o cross-check PF/PJ. SEMPRE filtrar `INSCRICAO > 0`.
2. **Predicados do N3 do funil incompletos** - a regra de particao exclusiva
   dos 5 sub-marcadores NAO funciona com predicados simples; precisa de
   priorizacao ORDER BY.
3. **VL_DIVIDA vs VALOR_PAGO** - DUAM_IT.VALOR = principal original (NAO
   somavel), DUAM_IT.VL_DIVIDA = valor a pagar com encargos (SOMAVEL).
4. **DUAM_IT.DATA_DIV_ATI NAO e data de inscricao confiavel** - usar EXISTS em
   LIVRO1 para "em DA".
5. **FLAG_PG_TOTAL=1 e flag de DOCUMENTO** - NAO garante DUAM_IT quitadas.
6. **LIVRO1.DUAM_IT = DUAM_IT.DUAM (NAO RECNUM)** - juncao errada infla
   metricas.
7. **PROC_FORUM aceita 5+ formatos + sentinela** - nao fazer `= 'N'` literal;
   usar `IS NULL OR TRIM(...) IN (...)`.
8. **CERTIDAO tem 2 colunas-pivo** - LIVRO1.INSCRICAO (CDA de DA) vs
   ARQ1033.NR_CERTIDAO (certidao de protesto). NAO misturar.
9. **"Otimizacao de query de brinde" muda semantica** - CTEs/LEFT JOIN
   "otimizados" podem trocar `com_cda` por `em_cda` e quebrar o dashboard
   "Analise para Transacao".
10. **AUTO.VALOR_ORIGINAL = 100% zerado** - caminho REAL do valor:
    AUTO -> DUAM -> LIVRO1 (NAO usar AUTO direto).
11. **Inadimplencia de parcelamento e MATURACAO** - 38% em 2026 NAO e calote,
    e efeito de parcela recem-vencida ainda nao paga (curva monotona por tempo
    desde vencimento).
12. **Proibido usar views pre-existentes do banco** - decisao do usuario;
    sempre reescrever como subqueries em cima de tabelas-base.
13. **Diferenciar PF x PJ por PESSOA.TP_PESSOA** (NUNCA por digitos do CGC).
14. **Backend crashando com ETIMEDOUT no pg-pool** - connectionTimeoutMillis=2s
    derrubava BoundPool sem handler. Ja corrigido (15s + listener).
15. **Inconsistencia VL_DIVIDA > 0 com VALOR_PAGO > 0** - existe em duplicidade;
    NAO assumir que `VALOR_PAGO > 0 AND VL_DIVIDA = 0` significa liquidado.

## 4. Como usar esta skill na pratica

1. Antes de QUALQUER query ao banco SCH: revisar encoding LATIN1 (regra #1).
2. Antes de QUALQUER funil/cobranca: revisar a maquina de estados (regra #2).
3. Para o detalhe de uma frente, ABRIR a sub-skill especifica pelo slug:
   - `dashboards-fiscalizai-banco-sch` - schema, integridade, decisoes estruturais.
   - `dashboards-fiscalizai-cobranca` - funil N1/N2/N3, DUAM, parcelamentos.
   - `dashboards-fiscalizai-cda-protesto` - CDA, protesto, demonstrativo.
4. Para snapshots/valores canonicos: ver memoria SNAPSHOT ESTRUTURAL DO BANCO
   SCH (na sub-skill banco-sch).
5. Para metodologias de Taxa de Recuperacao / Eficacia dos Canais / Inadimplencia
   por safra: ver sub-skill CDA/Protesto (Taxa) e cobranca (Inadimplencia).

## 5. Conexao com a skill `construtor-dashboards`

Esta mestra complementa a skill `construtor-dashboards` com CONHECIMENTO DE
DOMINIO do banco SCH. Para construir DASHBOARDS sobre estes dados, a IA deve:

1. Ativar `construtor-dashboards` para o fluxo MCP (list_connections,
   create_chart, add_chart_to_dashboard, publish_dashboard).
2. Ativar ESTA mestra + a sub-skill relevante para o DOMINIO especifico
   (cobranca, CDA/protesto, ou schema).
3. SEMPRE testar a query com `run_query` ANTES de criar o chart.
4. SEMPRE fazer `preview_chart_data` ANTES de `publish_chart`.

## 6. Indice das 45 memorias canonicas (jun/2026)

A mestra contem 0 memorias inline; TODAS estao expandidas nas 3 sub-skills.
Aqui o indice completo (por sub-skill):

### Em `dashboards-fiscalizai-banco-sch` (14 memorias)
""")

# Lista memórias por sub-skill
for cat, label in [('banco-sch', 'banco-sch'),
                   ('cobranca', 'cobranca'),
                   ('cda-protesto', 'cda-protesto')]:
    mems_in_cat = [m for m in memories if m['categories'][0] == cat]
    for m in mems_in_cat:
        mestra_sections.append(f"- [{m['idx']:02d}] {m['title_clean']}")

mestra_sections.append("""
Para o conteudo de cada uma, abra a sub-skill correspondente (a IA pode ativar
ate 1 skill por turno, entao abra a que cobre a sua duvida atual).
""")

mestra_body = ''.join([])  # não usado (já construímos via sections)

# Adiciona a lista já montada nas seções
# (na verdade o mestra_sections JÁ contém tudo)

# Escreve mestra
mestra_path = OUT / 'dashboards-fiscalizai-palmas.md'
mestra_content = (
    f'---\n'
    f'name: dashboards-fiscalizai-palmas\n'
    f'description: Skill MESTRA do banco SCH (Palmas, TO) - FiscalizaIA. Cobre o dataset canonico da receita tributaria municipal: DUAM, CDA, protesto, parcelamentos, PESSOA, SIGFACIL, encoding LATIN1, maquina de estados do credito tributario e as 15 armadilhas criticas mais importantes. Use como ponto de entrada; chame as 3 sub-skills (banco-sch, cobranca, cda-protesto) pelo slug para o detalhe de cada frente.\n'
    f'---\n\n'
    + ''.join(mestra_sections)
)
mestra_path.write_text(mestra_content, encoding='utf-8')
print(f'OK: {mestra_path} - {len(mestra_content)} chars / {len(mestra_content.splitlines())} lines')

# === SUB-SKILLS ===
sub_skills = {
    'dashboards-fiscalizai-banco-sch': {
        'description': 'Sub-skill 1 do banco SCH (Palmas) - schema, integridade, decisoes estruturais, encoding LATIN1, PESSOA, SIGFACIL, INSC_MUNICIPAL=0, snapshots, baseline. 14 memorias canonicas (jun/2026). Ative quando o tema for estrutura do banco, joins, modelagem de dados ou decisoes metodologicas de snapshot.',
        'category': 'banco-sch',
    },
    'dashboards-fiscalizai-cobranca': {
        'description': 'Sub-skill 2 do banco SCH (Palmas) - funil de cobranca (N1/N2/N3), DUAM, DUAM_IT, DUAM_REPACTO, parcelamentos (SMCALCREPAC/REFIS), inadimplencia por safra, maturacao, VALOR_PAGO x VL_DIVIDA. 19 memorias canonicas (jun/2026). Ative quando a tarefa envolver funil de receita, parcelamento, ciclo de vida do credito ou inadimplencia.',
        'category': 'cobranca',
    },
    'dashboards-fiscalizai-cda-protesto': {
        'description': 'Sub-skill 3 do banco SCH (Palmas) - CDA (Certidao de Divida Ativa), Protesto, Divida Ativa, LIVRO1, ARQ1033, CONTROLE_PROTESTO_ITENS, PROC_FORUM, Demonstrativo do contribuinte, Taxa de Recuperacao do Protesto, Eficacia dos Canais. 12 memorias canonicas (jun/2026). Ative quando a tarefa envolver CDA, protesto, divida ativa, execucao fiscal ou eficacia de canais de cobranca.',
        'category': 'cda-protesto',
    },
}

for slug, conf in sub_skills.items():
    cat = conf['category']
    mems_in_cat = [m for m in memories if m['categories'][0] == cat]
    sub_sections = []
    sub_sections.append(f"""# {slug}

> Sub-skill especializada do banco SCH (Palmas) - FiscalizaIA.
> Ative esta skill quando o tema da conversa for {cat.replace('-', '/')}.
> Para o indice completo e o modelo conceitual, abra a mestra:
> `dashboards-fiscalizai-palmas`.
>
> Encoding do banco: **LATIN1**. Toda query abaixo usa ASCII/acentos
> pt-BR; NUNCA travessao, reticencias, seta, aspas curvas ou simbolos
> matematicos Unicode em literais SQL.

## Indice das {len(mems_in_cat)} memorias desta sub-skill

""")
    for m in mems_in_cat:
        sub_sections.append(f"### [{m['idx']:02d}] {m['title_clean']}\n\n")
        sub_sections.append(m['body_clean'])
        sub_sections.append('\n\n---\n\n')

    sub_path = OUT / f'{slug}.md'
    sub_content = (
        f'---\n'
        f'name: {slug}\n'
        f'description: {conf["description"]}\n'
        f'---\n\n'
        + ''.join(sub_sections)
    )
    sub_path.write_text(sub_content, encoding='utf-8')
    print(f'OK: {sub_path} - {len(sub_content)} chars / {len(sub_content.splitlines())} lines')

print('\n=== Files gerados ===')
import os
for f in sorted(OUT.glob('*.md')):
    print(f'  {f.name}: {f.stat().st_size/1024:.1f}KB')
