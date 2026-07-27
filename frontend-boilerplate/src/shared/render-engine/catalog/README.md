# Catálogo de blocos (render-engine) — convenção plug-and-play

> **Esta é a convenção que T-I (biblioteca de componentes) deve seguir.**
> Criar uma pasta aqui = registrar um bloco. **Nada de índice central.**

## Anatomia de um bloco (1 pasta isolada)

```
catalog/<type>/
  manifest.ts     # PURO (sem React) — descreve o bloco p/ FE, BE e IA
  component.tsx   # só FE — renderiza + exporta `definition`
  fixture.ts      # dado de exemplo que casa com o dataContract (ou null)
  (component.test.tsx)   # opcional
```

O nome da pasta `<type>` **deve** ser igual a `manifest.type`.

### Regras de UI do bloco (valem desde a migração para o Astryx)

1. **Componente do DS antes de primitivo.** `Card`, `Table`, `Banner`, `Grid`,
   `Collapsible`, `Text`… Só caia para `<div>`/`<span>` quando o DS não cobrir.
2. **Gráfico e indicador vêm de `@/shared/ui`** (`AreaChart`, `BarList`,
   `KpiCard`, `ChartFrame`, `useChartPalette`) — nunca reimplemente cor de série
   nem estado vazio dentro do bloco.
3. **Zero valor de cor no código.** Cor sai de token (`var(--color-data-*)`, via
   `chartAccentColor()`); nada de hex, `rgb()` ou classe de cor do Tailwind.
4. **`style={{}}` só para valor de runtime** (geometria que depende do dado) ou
   **pintura de SVG com token** — sempre com um comentário justificando. O resto
   é prop do DS ou utility com token. `xstyle` não funciona aqui: o Vite deste
   app não compila StyleX.
5. **Quatro estados**: carregando, vazio, erro e desabilitado. O `BlockRenderer`
   cobre carregando/erro dos blocos de dados; o vazio (tabela sem linha, série
   sem ponto) é responsabilidade do bloco.
6. **Um `component.test.tsx` por bloco**, consultando por papel acessível —
   nunca por classe (os nomes são hashes do StyleX e mudam a cada build).
7. **Primitivo próprio mora na pasta do bloco**, com um comentário no topo
   dizendo por que o DS não resolve. Se dois blocos precisarem do mesmo, aí sim
   promova para `@/shared/ui`.

### `manifest.ts` (o que a IA lê via `build:catalog`)

```ts
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'bar_chart',
  kind: 'chart', // 'chart' | 'text' | 'title' | 'layout'
  name: 'Gráfico de Barras',
  description: 'Compara valores entre categorias.',
  source: 'vitrine:bar-chart', // slug Vitrine OU 'custom'
  propsSchema: {
    /* JSON Schema neutro das props visuais */
  },
  dataContract: {
    // AUSENTE em blocos narrativos (title/rich_text)
    shape: 'series', // 'scalar' | 'series' | 'categorical' | 'table'
    spec: {
      /* ... */
    },
    example: [
      /* ... */
    ],
  },
  defaultProps: { orientation: 'vertical' },
  version: '1.0.0',
} satisfies BlockManifest;
```

> Os 7 manifestos da base (kpi/bar_chart/line_chart/donut/table/title/rich_text)
> já existem prontos em `@dashboards/contracts` (`baseManifests`) — T-I pode
> reusá-los/importá-los.

### `component.tsx` (render + registro)

```tsx
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type Props = {
  /* ... */
};

export const Component: BlockComponent<Props /*, Data */> = ({ props, data, state }) => {
  // Renderize com o Astryx (`@astryxdesign/core/<Componente>`). Para gráficos e
  // indicadores, use a base própria em `@/shared/ui` — ela já resolve paleta por
  // token, estados e equivalente textual acessível.
  return <Card>{/* ... */}</Card>;
};

export const definition = defineBlock<Props>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
```

## Como o auto-registro funciona

- **FE**: `src/shared/render-engine/registry.ts` faz
  `import.meta.glob('./catalog/*/component.tsx', { eager: true })` e monta o
  registry em runtime, lendo o export `definition` de cada bloco. Resolva blocos
  com `getBlock(type)` / `listBlocks()`.
- **BE / IA**: `npm run build:catalog` (no backend) varre os `manifest.ts`,
  valida contra o `BlockManifestSchema` de `@dashboards/contracts` e gera
  `backend-boilerplate/src/catalog/catalog.manifests.json` (servido em `/catalog`
  e exposto no MCP `list_catalog`). Rode em build/CI e use `build:catalog:watch`
  no dev.

## Estados de render (BlockRenderer)

`skeleton | loading | success | error | empty`. Blocos **narrativos** (sem
`dataContract`) renderizam direto (`success`). Blocos de **dados** dependem do
`BlockDataResult` (use as fixtures de `@dashboards/contracts` enquanto a execução
real — T-C — não existe). Tipo não registrado → placeholder "não implementado".

## Usando componentes da Vitrine UI

O registry namespaced está em `components.json` (`@vitrine`). Instale o slug do
bloco antes de usar:

```bash
npx shadcn@latest add @vitrine/bar-chart
# ou pela URL completa:
npx shadcn@latest add https://ui-list-ui-componets-cmqcdlm7.cloud.serendiped.com/r/bar-chart.json
```

## Regra anti-colisão (doc 21)

Cada bloco é uma **pasta isolada** — N agentes podem adicionar N blocos em
paralelo sem tocar em nenhum arquivo compartilhado. **Não** crie um índice/barril
que liste os blocos manualmente.

> `__example/` é um bloco **placeholder** que prova o pipeline ponta a ponta
> (F0.4). Pode ser removido quando a base real (T-I) estiver no lugar.
