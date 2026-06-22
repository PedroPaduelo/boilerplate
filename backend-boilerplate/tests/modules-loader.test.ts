/**
 * Smoke test do AUTO-DISCOVERY de módulos (F0.5).
 *
 * Prova que `registerModules` (@fastify/autoload) descobre e registra TODOS os
 * módulos de domínio em `src/modules/<modulo>/index.ts` SEM que eles estejam
 * listados em `server.ts`. Esta é a fronteira anti-colisão das trilhas T-A..T-J.
 */
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { registerModules } from '@/http/modules-loader';

// NOTA: `connections` (T-A), `departments` (T-B1), `charts` (T-B2),
// `dashboards` (T-B3), `share` (T-B4), `data` (T-C) e `mcp` (T-D) já foram
// IMPLEMENTADOS — não têm mais `/_status`. Os demais módulos seguem como
// scaffold até suas trilhas os implementarem.
const EXPECTED_MODULES = [
  'export',
  'catalog',
];

describe('modules auto-discovery (F0.5)', () => {
  it('registra todos os módulos de domínio via autoload, sem tocar server.ts', async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(registerModules);
    await app.ready();

    for (const moduleName of EXPECTED_MODULES) {
      const res = await app.inject({
        method: 'GET',
        url: `/${moduleName}/_status`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ module: moduleName, status: 'scaffolded' });
    }

    await app.close();
  });
});
