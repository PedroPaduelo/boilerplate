/**
 * Registry do catálogo — AUTO-REGISTRO via `import.meta.glob` (Vite).
 *
 * Regra anti-colisão (doc 21): NÃO existe índice central editado à mão. Cada
 * bloco mora numa pasta isolada `catalog/<type>/` e se registra sozinho — criar
 * a pasta = registrar o bloco no FE. T-I adiciona os 7 blocos da base (e os
 * próximos) sem tocar em nenhum arquivo compartilhado.
 *
 * Convenção descoberta pelo glob:
 *   catalog/<type>/component.tsx  →  exporta `definition` (BlockDefinition)
 */
import type { BlockDefinition } from './types';

type BlockModule = {
  definition?: BlockDefinition;
  default?: BlockDefinition;
};

/** Glob estático (analisável pelo Vite em build/dev/teste). `eager` = sync. */
const modules = import.meta.glob<BlockModule>('./catalog/*/component.tsx', {
  eager: true,
});

/** Extrai o `<type>` da pasta a partir do caminho do módulo. */
function folderTypeFromPath(path: string): string {
  const m = path.match(/\/catalog\/([^/]+)\//);
  return m ? m[1] : '';
}

/**
 * Monta o registry a partir de um mapa de módulos. Exportado para testes
 * determinísticos (sem depender do glob real).
 */
export function buildRegistry(
  mods: Record<string, BlockModule>,
): Map<string, BlockDefinition> {
  const reg = new Map<string, BlockDefinition>();
  for (const [path, mod] of Object.entries(mods)) {
    const def = mod.definition ?? mod.default;
    if (!def) {
      console.warn(
        `[render-engine] ${path}: módulo sem export \`definition\` — ignorado.`,
      );
      continue;
    }
    const folder = folderTypeFromPath(path);
    if (folder && def.type !== folder) {
      console.warn(
        `[render-engine] ${path}: manifest.type "${def.type}" difere da pasta "${folder}".`,
      );
    }
    if (reg.has(def.type)) {
      console.warn(
        `[render-engine] tipo de bloco duplicado "${def.type}" (${path}) — sobrescrevendo.`,
      );
    }
    reg.set(def.type, def);
  }
  return reg;
}

const registry = buildRegistry(modules);

/** Resolve uma definição de bloco pelo `type` (catalogType). */
export function getBlock(type: string): BlockDefinition | undefined {
  return registry.get(type);
}

/** Lista todas as definições registradas. */
export function listBlocks(): BlockDefinition[] {
  return [...registry.values()];
}

/** Lista os tipos (catalogType) registrados. */
export function listBlockTypes(): string[] {
  return [...registry.keys()];
}

/** Indica se há um bloco registrado para o `type`. */
export function hasBlock(type: string): boolean {
  return registry.has(type);
}
