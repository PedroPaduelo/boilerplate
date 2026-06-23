# 33 — Catálogo de componentes (registro VIVO, plug-and-play)

> Status: 🔓 ABERTO/EVOLUTIVO — ✅ CONFIRMADO pelo usuário (rodada 7).
> O catálogo NÃO é uma lista fechada: começa com uma **base pequena pra testar** e
> cresce com o tempo. Adicionar um bloco novo = criar uma pasta → fica disponível
> automaticamente pro render (FE) E pra IA (MCP). Sem cadastro manual.

## 1. Filosofia (o que o usuário pediu)
- **Plug-and-play de código**: componentizar bem + “registrar em um lugar” = a própria
  pasta do bloco. Criou a pasta → entrou no catálogo.
- **Fonte única da verdade**: a pasta do bloco. Dela saem 3 consumidores:
  1. **Render no FE** (dashboard, preview, chat),
  2. **`GET /catalog`** (FE lista o que existe),
  3. **MCP `list_catalog`** (a IA descobre o bloco novo e já sabe usá-lo).
- **Qualquer um adiciona** (o usuário, nós, um agente): mesmo padrão para Vitrine UI
  ou componente próprio dele.

## 2. Anatomia de um bloco (pasta isolada)
```
shared/render-engine/catalog/<type>/
  manifest.ts     # PURO (sem React) — descreve o bloco p/ FE, BE e IA
  component.tsx   # só FE — renderiza
  fixture.ts      # dado de exemplo (preview/dev/testes)
  (component.test.tsx)
```

### manifest.ts (o que a IA lê)
```ts
export const manifest = {
  type: 'bar_chart',
  kind: 'chart',                 // 'chart' | 'text' | 'title' | 'layout'
  name: 'Gráfico de Barras',
  description: 'Compara valores entre categorias.',
  source: 'vitrine:bar-chart',   // origem (slug Vitrine) ou 'custom'
  propsSchema: { /* JSON Schema neutro */ },
  dataContract: {                // ausente em blocos sem dados (title/text)
    shape: 'series',
    spec: { x: { type:'category', required:true }, y: { type:'number', required:true } },
    example: [ { x:'Jan', y:120 }, { x:'Fev', y:90 } ],
  },
  defaultProps: { orientation: 'vertical' },
} as const;
```
> JSON Schema neutro (não Zod) → mesmo manifesto serve BE (validação + /catalog + MCP) e FE,
> sem o conflito Zod v3×v4.

### component.tsx
```tsx
import { manifest } from './manifest';
export const Component: BlockComponent<Props, Data> = ({ props, data, state }) => { /* ... */ };
export const definition = { ...manifest, Component, fixture };
```

## 3. Auto-registro (o “registrar em um lugar” = nenhum lugar central)
- **FE**: `import.meta.glob('./catalog/*/component.tsx', { eager:true })` monta o registry
  em runtime. **Ninguém edita índice central** → zero conflito de merge.
- **BE / MCP**: um pequeno **script de coleta** (`build:catalog`) varre os `manifest.ts`,
  valida e gera `catalog.manifests.json` (sem React) que o BE serve em `/catalog` e o MCP
  expõe em `list_catalog`. Roda no build/CI (e em watch no dev).
- Efeito: **adicionar um bloco → a IA passa a vê-lo no próximo build**, com a documentação
  rígida (dataContract) que ela precisa pra gerar a query certa.

## 4. Receita: adicionar UM bloco novo (o plug-and-play na prática)
1. `mkdir shared/render-engine/catalog/<type>`
2. `manifest.ts` (type, kind, name, description, propsSchema, dataContract, defaultProps)
3. `component.tsx` (render — pode instalar o slug Vitrine: `npx shadcn add .../r/<slug>.json`)
4. `fixture.ts` (exemplo que casa com o dataContract)
5. teste/preview com a fixture
6. (build:catalog regenera os manifests → FE, BE e IA já enxergam)
→ É também a **unidade de paralelização**: 1 agente por bloco, sem colisão.

## 5. BASE inicial (pequena — só pra testar o pipeline ponta a ponta)
> Cobre os principais "shapes" pra exercitar contrato + render + cache + IA:
| type | shape | Vitrine slug | por que está na base |
|------|-------|--------------|----------------------|
| `kpi` | scalar | `kpi-card` | métrica única (escalar) |
| `bar_chart` | series (x categórico, y num) | `bar-chart` | categórico vertical |
| `line_chart` | series (x temporal, y num) | `line-chart` | série temporal |
| `donut` | categorical (label+value) | `donut-chart` | distribuição |
| `table` | table (colunas) | `data-table` | tabular cru |
| `title` | — (sem dados) | tipografia | bloco narrativo |
| `rich_text` | — (sem dados) | markdown (lib leve) | texto do relatório |

Depois a gente vai somando: `h_bar_chart`, `sparkline`, `gauge` (radial-gauge),
`heatmap` (latency-heatmap), `donut_breakdown`, `stat_tile`, etc. — **um a um**.

## 6. Quando o usuário criar um componente próprio (não-Vitrine)
- Mesmo padrão: cria a pasta com `manifest.ts` + `component.tsx` + `fixture.ts`,
  `source: 'custom'`. Auto-registra igual. A IA passa a oferecê-lo sem mais nada.

## 7. Decisões em aberto (catálogo)
- [ ] `build:catalog`: script próprio vs glob + codegen (definir na Fase 0).
- [ ] Lib leve de markdown p/ `rich_text` (ex.: marked/markdown-it + sanitização).
- [ ] Validação de dados no BE: usar `dataContract.spec` (JSON Schema) com ajv.
- [ ] Versionar manifesto do bloco? (provável: campo `version` no manifest, opcional).
