import path from 'node:path';
import fastifyAutoload from '@fastify/autoload';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

/**
 * Diretório raiz dos módulos de domínio auto-descobertos.
 *
 * Em dev (tsx) resolve para `src/modules`; no build (tsup) resolve para
 * `dist/modules` — por isso o glob `src/modules/(asterisco)(asterisco)/(asterisco).ts`
 * está incluído no `entry` de `tsup.config.ts` (cada módulo vira um arquivo em
 * `dist/modules/...`).
 */
export const MODULES_DIR = path.join(__dirname, '..', 'modules');

/**
 * Registro de rotas por AUTO-DISCOVERY (ponto de extensão da Fase 0).
 *
 * Cada módulo do fan-out é UMA pasta em `src/modules/<modulo>/` com um arquivo
 * `index.ts` que faz `export default` de um `FastifyPluginAsync`. O
 * `@fastify/autoload` encontra e registra cada um automaticamente — então NENHUMA
 * trilha precisa editar `server.ts` nem este arquivo para plugar suas rotas.
 *
 * Regras da convenção (ver `src/modules/README.md`):
 *  - `indexPattern` = só arquivos `index.*` são tratados como plugin do módulo.
 *    Sub-arquivos (`routes/*.ts`, `service.ts`, `schema.ts`, ...) são IGNORADOS
 *    pelo autoload; o `index.ts` do módulo é quem os importa/registra.
 *  - `dirNameRoutePrefix: false` = o autoload NÃO prefixa rotas com o nome da
 *    pasta. Cada plugin declara seus próprios paths absolutos (`/connections`,
 *    `/dashboards/:id/data`, ...), mantendo a superfície REST do doc 31 explícita.
 *  - `ignorePattern` = arquivos de teste não são carregados como plugin.
 *
 * Encapsulamento: cada plugin roda no seu próprio escopo Fastify (default do
 * autoload). Para expor um decorator globalmente, o módulo deve usar
 * `fastify-plugin` no seu próprio arquivo — não há ponto central compartilhado.
 */
export const registerModules = fp(
  async (app: FastifyInstance) => {
    await app.register(fastifyAutoload, {
      dir: MODULES_DIR,
      // Só `index.ts`/`index.js` é o plugin do módulo; irmãos são ignorados.
      indexPattern: /^index\.(ts|js|cjs|mjs)$/,
      // Não carregar arquivos de teste como plugin.
      ignorePattern: /.*\.(test|spec)\.(ts|js|cjs|mjs)$/,
      // Cada módulo declara seus próprios paths — sem prefixo automático.
      dirNameRoutePrefix: false,
    });
  },
  { name: 'app-modules-loader' },
);
