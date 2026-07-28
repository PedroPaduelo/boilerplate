# A exportação em PDF

Como o botão "Exportar" funciona — e por que ele demorou a existir.

## O que havia antes

O backend tinha o módulo `export` inteiro: rota com RBAC (`artifacts:export`),
fila BullMQ, worker, geração por Playwright sobre a rota `/print/dashboards/:id`
e storage do arquivo pronto. Tudo testado.

A interface respondia:

```ts
export: () => toast.info('Exportação em PDF chega em breve (T-J).')
```

Um item de menu que anuncia a própria ausência é pior que a ausência: ele ocupa
o lugar onde o usuário procuraria a função e ensina que ela não existe. Ligar a
UI sobre uma capacidade pronta foi o melhor retorno por esforço da revisão.

## O caminho

```
menu / botão
   │
   ├─ POST /export/dashboards/:id/pdf   { mode, filters, async: true }
   │     ├─ 202 { jobId, statusUrl, downloadUrl }   ← caminho normal
   │     └─ 200 application/pdf                      ← fila degradada (síncrono)
   │
   ├─ GET /export/jobs/:jobId           a cada 1,5 s, teto de ~90 s
   │     queued → running → done | error
   │
   └─ GET /export/jobs/:jobId/pdf       baixa e dispara o download
```

O hook é `features/dashboards/use-export-pdf.ts`. Ele existe fora dos
componentes porque a listagem e a tela aberta disparam a mesma coisa com
entradas diferentes.

## Decisões que não são óbvias

### O PDF reflete a TELA, não o artefato

Na tela de um dashboard aberto, o export manda o `mode` efetivo (rascunho ou
publicado) e **os valores de filtro que estão aplicados naquele momento**. Quem
filtrou por "2026 · Secretaria de Saúde" e exportou espera exatamente aquilo no
arquivo — um PDF com o dashboard inteiro seria outro documento.

Na listagem, onde não há filtros aplicados, vale o modo natural do artefato:
publicado quando existe, senão o rascunho (o preview do dono).

### Um export por vez

Gerar PDF sobe um Chromium headless. Cinco cliques em cinco linhas da listagem
criariam cinco jobs e nenhuma resposta rápida. O segundo clique enquanto o
primeiro roda ganha um aviso — e a guarda é um `ref` (síncrono), não o estado
de React: dois cliques no mesmo tick passariam por uma checagem de `useState`.

### O nome do arquivo é o título

`Relatório de Frota 2026` vira `relatorio-de-frota-2026.pdf`. Quem exporta
evidência arquiva o arquivo; `cms4hgsev001hjy0p51o61zvg.pdf` não se acha três
meses depois.

### As duas respostas de sucesso

`POST` responde 202 com JSON **ou** o PDF cru (quando o Redis está degradado e o
backend gera na hora). O cliente pede `responseType: 'blob'` e discrimina pelo
`Content-Type` — assumir JSON quebraria justamente no dia em que a fila caísse.

### Falha diz o que aconteceu

O `message` do job atravessa até o toast. Verificado no ambiente sem o Chromium
instalado: a tela mostrou `browserType.launch: Executable doesn't exist…` em vez
de "algo deu errado". Feio, e correto — quem opera precisa do motivo real.

## Verificação

```bash
# ponta a ponta, com o backend rodando e o seed aplicado
TOKEN=$(curl -s -X POST localhost:4000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@prefeitura.local","password":"admin1234"}' | jq -r .token)

JOB=$(curl -s -X POST localhost:4000/export/dashboards/<id>/pdf \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"mode":"published","filters":{},"async":true}' | jq -r .jobId)

curl -s localhost:4000/export/jobs/$JOB -H "Authorization: Bearer $TOKEN"   # queued→running→done
curl -s -o saida.pdf localhost:4000/export/jobs/$JOB/pdf -H "Authorization: Bearer $TOKEN"
```

Medido nesta base: `done` em ~4 s, 530.705 bytes, `application/pdf`.

Do lado da interface, `features/dashboards/__tests__/use-export-pdf.test.tsx`
cobre os quatro desfechos: fila, síncrono, job com erro e clique duplo.

## O que ficou de fora

- **Exportar um gráfico isolado.** Não há rota no backend; o item saiu do menu
  em vez de continuar prometendo. Ver ROADMAP § 6.
- **Progresso visível durante a geração.** Hoje o botão fica em carregamento e
  o toast avisa nas pontas. Uma bandeja de tarefas faria sentido se o produto
  ganhar exports longos ou em lote — o `state` por job já existe.
