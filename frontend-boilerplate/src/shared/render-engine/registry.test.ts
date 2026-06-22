import { describe, expect, it } from 'vitest';
import {
  getBlock,
  hasBlock,
  listBlocks,
  listBlockTypes,
  buildRegistry,
} from './registry';
import { definition as exampleDefinition } from './catalog/__example/component';

describe('render-engine registry (auto-registro via glob)', () => {
  it('descobre o bloco de exemplo sem índice central', () => {
    expect(hasBlock('__example')).toBe(true);
    const def = getBlock('__example');
    expect(def).toBeDefined();
    expect(def?.type).toBe('__example');
    expect(def?.manifest.type).toBe('__example');
    expect(typeof def?.Component).toBe('function');
  });

  it('expoe listBlocks/listBlockTypes coerentes', () => {
    expect(listBlockTypes()).toContain('__example');
    expect(listBlocks().some((d) => d.type === '__example')).toBe(true);
  });

  it('manifest.type bate com o type da definition', () => {
    expect(exampleDefinition.type).toBe(exampleDefinition.manifest.type);
  });

  it('buildRegistry ignora modulos sem `definition`', () => {
    const reg = buildRegistry({
      './catalog/foo/component.tsx': {},
    });
    expect(reg.size).toBe(0);
  });
});
