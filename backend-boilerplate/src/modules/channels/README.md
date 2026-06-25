# Módulo `channels` — WhatsApp via Evolution API

Integração inbound→outbound: **qualquer pessoa manda uma mensagem de texto para
o número institucional** (conectado a uma instância da Evolution API) e o
**agente de IA existente** responde de volta pelo WhatsApp.

```
WhatsApp do usuário
   │  (texto)
   ▼
Evolution API (instância) ──POST /webhooks/evolution──▶ backend (este módulo)
                                                          │
                                          extractTextMessage (payload.ts)
                                          markSeen (idempotency.ts, Redis 24h)
                                          getOrCreateWhatsappConversation
                                          addMessage(USER)  ← síncrono
                                          200 OK ───────────────────┐
                                                                    │ (fire-and-forget)
                                          processWhatsappMessage (handler.ts)
                                            runAgent (tools={}, MVP)
                                            addMessage(ASSISTANT)
                                            evolutionClient.sendText ──▶ Evolution ──▶ WhatsApp do usuário
```

## Componentes

| Arquivo | Responsabilidade |
|---|---|
| `index.ts` | Plugin Fastify auto-descoberto. Registra a rota do webhook (SEM auth JWT). |
| `routes/webhook-evolution.ts` | `POST /webhooks/evolution`. Valida env/secret, normaliza, dedup, persiste USER, dispara handler async. |
| `payload.ts` | Schema Zod + `extractTextMessage` (ignora mídia, `fromMe`, vazios). |
| `idempotency.ts` | `markSeen` (Redis SETNX semântico, TTL 24h, fail-open em dev). |
| `conversation-link.ts` | `getOrCreateWhatsappConversation` (id determinístico `${epochMs}-${phone}`). |
| `handler.ts` | `processWhatsappMessage`: runAgent → trunca (4000 + " (continua...)") → persiste → sendText. |
| `evolution-client.ts` | `evolutionClient.sendText` (axios, fail-soft → `{ key: null }`). |
| `system-prompt-whatsapp.md` | System prompt curto e fixo (respostas concisas, sem markdown pesado). |
| `types.ts` | `Channel`, `InboundTextMessage`, `SendTextResult`. |

O "dono" das conversas é o **WhatsApp System user** (`whatsapp-system@platform.internal`,
role=ADMIN, isActive=false), criado pelo seed. Ver `src/lib/whatsapp-system.ts`.

## Variáveis de ambiente

```bash
# Obrigatórias para HABILITAR o canal (sem as 3, /webhooks/evolution → 503).
EVOLUTION_API_URL=http://localhost:8080   # base URL da Evolution
EVOLUTION_INSTANCE=palmas                 # nome da instância (case-sensitive)
EVOLUTION_APIKEY=troque-pela-apikey       # apikey da instância (header `apikey`)

# Opcional: gate do webhook. Se setado, exige header `x-channel-secret`.
CHANNELS_WEBHOOK_SECRET=

# Necessária para o agente responder de verdade (sem ela o handler só
# persiste um aviso e NÃO chama sendText).
ANTHROPIC_API_KEY=sk-ant-...
```

`isEvolutionEnabled()` (em `src/lib/env.ts`) = `Boolean(EVOLUTION_API_URL && EVOLUTION_INSTANCE && EVOLUTION_APIKEY)`.

## Rodar a Evolution API localmente (docker)

```bash
docker run -d --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY='troque-por-um-token-forte' \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest
```

> A imagem oficial pode variar de tag/configuração entre versões. Consulte a
> doc oficial: https://docs.evolutionfoundation.com.br/evolution-api/
> Para produção, use Postgres/Redis dedicados (a Evolution suporta).

### 1) Criar uma instância e conectar o número

Pela UI (`http://localhost:8080/manager`) ou via API:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H 'apikey: troque-por-um-token-forte' \
  -H 'Content-Type: application/json' \
  -d '{ "instanceName": "palmas", "qrcode": true, "integration": "WHATSAPP-BAILEYS" }'
```

Escaneie o QR Code com o WhatsApp do número institucional.

### 2) Apontar o webhook da instância para o backend

```bash
curl -X POST http://localhost:8080/webhook/set/palmas \
  -H 'apikey: troque-por-um-token-forte' \
  -H 'Content-Type: application/json' \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://<seu-deploy>/webhooks/evolution",
      "headers": { "x-channel-secret": "<CHANNELS_WEBHOOK_SECRET se setado>" },
      "events": ["MESSAGES_UPSERT"]
    }
  }'
```

> Em desenvolvimento local, exponha o backend com um túnel (ngrok/cloudflared)
> e use a URL pública no campo `url`.

## Smoke test (sem WhatsApp real)

Com o backend rodando (envs Evolution setadas), dispare o sample:

```bash
curl -s -X POST http://localhost:4000/webhooks/evolution \
  -H 'Content-Type: application/json' \
  -d @_meta/wa-sample.json | jq
# → { "ok": true, "conversationId": "...", "messageId": "...", "isNew": true }
```

Verifique que a `Conversation` + a `ChatMessage` (role=user) foram criadas:

```bash
# Lista conversas WhatsApp (ADMIN, todas):
#   GET /agent/conversations?source=whatsapp&scope=all   (Bearer de um ADMIN)
```

Sem `ANTHROPIC_API_KEY`, o handler não completa o turno do agente (persiste um
aviso e não envia resposta) — o objetivo do smoke é provar que o webhook
recebe, normaliza, dedup e persiste a mensagem do usuário.

## Listar conversas do canal (ADMIN)

`GET /agent/conversations` ganhou dois query params:

| Param | Valores | Efeito |
|---|---|---|
| `source` | `whatsapp` \| `app` | filtra por origem (`metadata->>'source'`). |
| `scope` | `all` | ADMIN-only: lista de TODOS os donos. Não-ADMIN → 403. |

Exemplos:
- `GET /agent/conversations?source=whatsapp` — minhas conversas WhatsApp.
- `GET /agent/conversations?source=whatsapp&scope=all` — (ADMIN) todas as conversas WhatsApp da plataforma.

## Decisões de design

- **Webhook público** (sem JWT): a Evolution chama de fora do domínio. Gate por
  `CHANNELS_WEBHOOK_SECRET` (opcional) e, em prod, restrinja o IP da Evolution
  no reverse-proxy.
- **2xx sempre que a mensagem foi aceita/ignorada**: a Evolution retenta em
  não-2xx; usar 4xx para "mídia ignorada" causaria backoff agressivo sem motivo.
- **Fire-and-forget**: o `runAgent` pode levar 5-20s; respondemos 200 imediato
  e processamos a resposta em background (`setImmediate`).
- **Idempotência por messageId** (Redis 24h): evita resposta duplicada quando a
  Evolution reentrega.
- **Permissão**: reusa `artifacts:view` (ADMIN já tem). Sem permissão nova.
- **Tools={} no MVP**: o agente responde só com o LLM (sem MCP). Evoluir depois.

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| `503 channel_disabled` | falta `EVOLUTION_API_URL/INSTANCE/APIKEY` | setar as 3 envs e reiniciar |
| `401 invalid_secret` | `CHANNELS_WEBHOOK_SECRET` setado, header errado/ausente | enviar `x-channel-secret` correto no webhook da Evolution |
| `200 ignored` sempre | payload não é texto ou é `fromMe` | conferir `messageType` (`conversation`/`extendedTextMessage`) |
| usuário não recebe resposta | `ANTHROPIC_API_KEY` ausente OU Evolution fora | ver logs `channels: ...`; a msg ASSISTANT fica no DB pra reenvio |
| resposta cortada com "(continua...)" | resposta > 4000 chars | esperado (truncamento por design) |
| conversas não aparecem em `?source=whatsapp` | metadata não gravada | conferir migration `channels_whatsapp_metadata` aplicada |
