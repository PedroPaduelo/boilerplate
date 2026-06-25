#!/bin/bash
# T14 - re-roda o MESMO prompt do T13 contra o agent COM system prompt + skill mestra
# atualizados (nova secao 6 do system prompt + regra de comunicacao no inicio da
# skill mestra). Salva o stream em test-T14-system-applied.stream para comparacao.

set -e
BASE="http://localhost:4000"
OUT="/workspace/_meta/agent-e2e"

echo "=== AUTH ==="
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "TOKEN ok: ${TOKEN:0:30}..."

PROMPT="Quais sao as armadilhas criticas do banco SCH de Palmas que voce conhece?"
echo ""
echo "=== PROMPT T14 ==="
echo "$PROMPT"

CONV=$(curl -s -X POST "$BASE/agent/conversations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"T14 - tom de voz aplicado"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "CONV_ID=$CONV"
echo "CONV=$CONV" > "$OUT/t14_conv.txt"
echo "START=$(date +%s)" >> "$OUT/t14_conv.txt"

timeout 120 curl -s -N -X POST "$BASE/agent/chat/$CONV" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"message\":\"$PROMPT\"}" \
  > "$OUT/test-T14-system-applied.stream" 2>&1 || echo "  (curl timeout/truncado)"

echo "EXIT=$? END=$(date +%s)" >> "$OUT/t14_conv.txt"
echo "DONE" >> "$OUT/t14_conv.txt"
echo ""
echo "=== STREAM SALVO em $OUT/test-T14-system-applied.stream ==="
wc -l "$OUT/test-T14-system-applied.stream"
