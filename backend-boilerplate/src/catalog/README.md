# Catálogo de manifestos (gerado)

`catalog.manifests.json` é **gerado** por `npm run build:catalog` a partir das
pastas de bloco do frontend (`frontend-boilerplate/src/shared/render-engine/catalog/*/manifest.ts`).
**Não edite à mão.**

- Cada entrada é um `BlockManifest` neutro, validado contra o `BlockManifestSchema`
  de `@dashboards/contracts` no momento da geração.
- Consumidores: `GET /catalog` (backend lista o que existe) e o MCP `list_catalog`
  (a IA descobre blocos novos e seus `dataContract`).

## Regenerar

```bash
npm run build:catalog          # uma vez (sai != 0 se algum manifesto for inválido)
npm run build:catalog:watch    # regenera ao salvar (dev)
```

Configurável por env: `CATALOG_DIR` (pasta dos blocos) e `CATALOG_OUT` (saída).
