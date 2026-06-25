#!/bin/bash
# Validação E2E completa do agente de BI - 5 cenários realistas.
# Espera: BE em http://localhost:4000 + user demo@example.com.

set -e
BASE="http://localhost:4000"
OUT="_meta/agent-e2e"
mkdir -p "$OUT"

echo "=== AUTH ==="
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "TOKEN ok: ${TOKEN:0:30}..."

run_scenario() {
  local N=$1
  local PROMPT=$2
  local DESC=$3
  echo ""
  echo "=== CENÁRIO $N: $DESC ==="
  echo "PROMPT: $PROMPT"
  local CONV=$(curl -s -X POST "$BASE/agent/conversations" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":\"e2e-$N\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "CONV_ID=$CONV"
  timeout 180 curl -s -N -X POST "$BASE/agent/chat/$CONV" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"message\":\"$PROMPT\"}" \
    > "$OUT/scenario-$N.stream" 2>&1 || echo "  (curl timeout/truncado)"
  echo ""
  echo "--- ANÁLISE ---"
  python3 -c "
import json, sys
import re
text = open('$OUT/scenario-$N.stream').read()
events = re.findall(r'event: (\w+)\ndata: (.+)', text)
tools = []
for ev, data in events:
    try:
        d = json.loads(data)
        if ev == 'tool_step':
            tc = d.get('toolCallId', '?')[:25]
            tools.append(f\"  - {d.get('toolName','?')}({d.get('phase','?')}, toolCallId={tc})\")
        elif ev == 'text_delta':
            pass
        elif ev == 'final':
            print(f'  FINAL: finishReason={d.get(\"finishReason\")}, steps={d.get(\"steps\")}, elapsedMs={d.get(\"elapsedMs\")}')
        elif ev == 'error':
            print(f'  ERROR: {d.get(\"message\",\"?\")[:200]}')
    except Exception as e:
        pass
print(f'TOTAL EVENTOS: {len(events)}')
print(f'TOOLS CHAMADAS:')
for t in tools: print(t)
# Validações críticas:
activate_called = any('activate_skill' in t and 'call' in t for t in tools)
sql_used = any('run_query' in t for t in tools)
errors = [e for e in events if e[0] == 'error']
print()
print(f'✅ activate_skill foi chamado? {activate_called}')
print(f'✅ run_query foi chamado? {sql_used}')
if errors:
    print(f'⚠️  ERROS NO STREAM: {len(errors)}')
    for ev, data in errors:
        try:
            d = json.loads(data)
            print(f'   {d.get(\"message\",\"?\")[:150]}')
        except: pass
"
}

# Cenário 1: KPI simples de receita
run_scenario 1 \
  "Crie um KPI mostrando o total de receita prevista de Palmas no ano de 2025." \
  "KPI simples (scalar + 1 query)"

# Cenário 2: Dashboard com 5 gráficos (mais complexo)
run_scenario 2 \
  "Crie um dashboard de receita de Palmas 2025 com 5 visualizacoes: 1 KPI de total, 1 grafico de linha da evolucao mensal, 1 donut por tributo, 1 ranking top 10 secretarias e 1 tabela detalhada." \
  "Dashboard multi-bloco"

# Cenário 3: Chart com SQL complexa
run_scenario 3 \
  "Monte um grafico de barras horizontais mostrando os 10 maiores contratos de compras de Palmas, com valor formatado em reais." \
  "Chart com SQL complexa (ranking + format BRL)"

# Cenário 4: Erro tratado graciosamente
run_scenario 4 \
  "Crie um grafico de pizza com os 5 maiores inadimplentes do IPTU de Palmas. (Note: se a fonte nao tiver essa info, me avise.)" \
  "Tratamento de erro"

# Cenário 5: Auto-ativação de skill
run_scenario 5 \
  "Faca um dashboard completo sobre divida ativa de Palmas." \
  "Auto-ativação de skill"

echo ""
echo "=== FIM ==="
ls -la "$OUT"
