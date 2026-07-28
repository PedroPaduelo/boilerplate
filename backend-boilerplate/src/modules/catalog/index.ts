import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { getCatalogBlockRoute } from './routes/get-catalog-block';
import { listCatalogRoute } from './routes/list-catalog';
import { validateCatalogBlockRoute } from './routes/validate-catalog-block';

/**
 * Módulo `catalog` — a superfície HTTP do catálogo VIVO.
 *
 * O catálogo é gerado em build-time por `npm run build:catalog`, que varre as
 * pastas de bloco do front e emite `src/catalog/catalog.manifests.json`. Este
 * módulo o SERVE; ele não é a fonte da verdade nem a duplica.
 *
 *   GET  /catalog            lista os tipos (filtros: kind, shape, search)
 *   GET  /catalog/:type      manifesto completo de um tipo
 *   POST /catalog/validate   ensaio a seco: tipo + props + dado conformam?
 *
 * Todas exigem `artifacts:view` — descrever como se constrói um artefato
 * acompanha a permissão de vê-lo.
 *
 * POR QUE EXISTE: antes daqui só havia `/catalog/_status` devolvendo
 * `{"status":"scaffolded"}`. O front lia o registry do próprio bundle e o
 * agente lia o JSON do build, sem nenhum ponto de comparação entre os dois —
 * uma divergência entre eles só aparecia como "bloco não implementado" na tela
 * do usuário. `catalogVersion` na resposta é o que torna essa comparação
 * possível.
 */
const catalogModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await listCatalogRoute(app);
  await validateCatalogBlockRoute(app);
  // Depois das rotas fixas: `/catalog/validate` não pode ser capturado por
  // `/catalog/:type`.
  await getCatalogBlockRoute(app);
};

export default catalogModule;
