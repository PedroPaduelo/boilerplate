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
  // renderize usando componentes da Vitrine UI / shadcn (@/components/ui/...)
  return <div>{/* ... */}</div>;
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
