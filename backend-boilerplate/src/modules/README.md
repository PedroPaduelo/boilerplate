# `src/modules/` — Módulos de domínio (auto-discovery)

> **Ponto de extensão da Fase 0 (F0.5).** Aqui é onde cada trilha do fan-out
> (T-A..T-J) pluga suas rotas **sem editar `server.ts`** e **sem colidir** com as
> outras trilhas. Cada módulo é uma pasta isolada — um arquivo, um dono.

## Como funciona

`server.ts` registra **uma única vez** o loader `registerModules`
(`src/http/modules-loader.ts`), que usa **`@fastify/autoload`** para varrer esta
pasta e registrar automaticamente todo módulo encontrado. Nada de índice central
editado à mão.

## Convenção (obrigatória)

```
src/modules/<modulo>/
  index.ts            ← ÚNICO arquivo que o autoload carrega como plugin
  routes/*.ts         ← (opcional) handlers, registrados pelo index.ts
  service.ts          ← (opcional) regra de negócio
  schema.ts           ← (opcional) schemas Zod do módulo
```

- O `index.ts` faz **`export default`** de um `FastifyPluginAsync`.
- Apenas arquivos `index.*` são tratados como plugin (`indexPattern`). Os irmãos
  (`routes/`, `service.ts`, ...) são **ignorados** pelo autoload — é o `index.ts`
  que os importa e registra. Isso evita registro duplicado.
- **Sem prefixo automático** (`dirNameRoutePrefix: false`): cada plugin declara
  paths **absolutos** (`/connections`, `/dashboards/:id/data`, ...), espelhando a
  superfície REST do `docs/plano/31-backend-arquitetura.md`.
- Arquivos `*.test.ts` / `*.spec.ts` não são carregados como plugin.
- Use sempre `app.withTypeProvider<ZodTypeProvider>()` e preencha `schema.tags`
  para aparecer agrupado no Swagger (`/docs`).

## Template mínimo (`index.ts`)

```ts
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const myModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/my-route',
    { schema: { tags: ['MyModule'], response: { 200: z.object({ ok: z.boolean() }) } } },
    async () => ({ ok: true }),
  );
};

export default myModule;
```

### Dividindo em vários arquivos

```ts
// src/modules/connections/index.ts
import type { FastifyPluginAsync } from 'fastify';
import { createConnection } from './routes/create-connection';
import { listConnections } from './routes/list-connections';

const connectionsModule: FastifyPluginAsync = async (app) => {
  await createConnection(app);
  await listConnections(app);
};

export default connectionsModule;
```

Cada `routes/*.ts` exporta uma função `(app) => void` (estilo das rotas legadas em
`src/http/routes/`). Como o autoload só carrega `index.*`, esses arquivos só rodam
quando o `index.ts` os chama.

## Encapsulamento / decorators globais

Cada módulo roda no seu próprio escopo Fastify (encapsulado). Se precisar expor um
decorator/hook para o app inteiro, embrulhe o plugin do módulo com
`fastify-plugin` no próprio `index.ts`. **Não existe** arquivo central
compartilhado para isso — cada módulo é autossuficiente.

## Mapa módulo → trilha (doc 21 / 31)

| Pasta          | Trilha     | Responsabilidade                                   |
| -------------- | ---------- | -------------------------------------------------- |
| `connections`  | T-A        | CRUD + test + schema + query (preview)             |
| `departments`  | T-B        | CRUD departamento + membership                     |
| `charts`       | T-B        | CRUD draft + publish/unpublish                     |
| `dashboards`   | T-B        | CRUD draft + publish/unpublish                     |
| `data`         | T-C        | hidratação dos blocos (cache + fila + socket)      |
| `share`        | T-B        | criar/revogar link + `GET /public/:token` (público) |
| `export`       | T-J        | PDF                                                |
| `catalog`      | T-I / T-D  | `GET /catalog` (manifestos do catálogo vivo)       |
| `mcp`          | T-D        | servidor MCP (tools)                               |

> As rotas `/<modulo>/_status` que vêm no scaffold são apenas marcadores (provam
> o auto-discovery e populam o Swagger). Remova-as ao implementar a rota real.

## O que NÃO mexer

- `server.ts` — fechado na Fase 0. Não adicione `app.register(...)` de rota lá.
- `src/http/modules-loader.ts` — config do autoload. Fechado na Fase 0.
- `src/socket.ts` / `src/socket/` — infra de Socket.IO. Use os helpers
  (`socketManager.sendToRoom(dashboardRoom(id), SOCKET_EVENTS.X, payload)`); não
  reconfigure o servidor.
