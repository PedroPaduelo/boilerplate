/**
 * Trava a regra que o `rich_text` quebrou: card da grade e playground mostram
 * o MESMO exemplo.
 *
 * O sintoma era o pior tipo de inconsistência — silenciosa e só visível na
 * transição: a miniatura exibia um resumo executivo e, ao clicar, o playground
 * abria com o campo obrigatório vazio e o preview em branco. A causa era um
 * mapa de props de exemplo duplicado em dois arquivos.
 */
import { describe, expect, it } from 'vitest';
import { getCatalogEntries } from '../catalog-entries';
import { previewPropsFor, PREVIEW_PROPS } from '../preview-props';
import { initialPropsFor } from '../../components/playground/playground-helpers';

describe('props de exemplo dos blocos narrativos', () => {
  it('o playground abre com as mesmas props que o card da grade mostra', () => {
    for (const [type, exemplo] of Object.entries(PREVIEW_PROPS)) {
      const entry = getCatalogEntries().find((e) => e.type === type);
      expect(entry, `bloco "${type}" não está no registry`).toBeDefined();

      const noCard = entry!.block.props as Record<string, unknown>;
      const noPlayground = initialPropsFor(
        entry!.definition.manifest,
        previewPropsFor(type),
      );

      for (const chave of Object.keys(exemplo)) {
        expect(noCard[chave], `card: ${type}.${chave}`).toEqual(exemplo[chave]);
        expect(noPlayground[chave], `playground: ${type}.${chave}`).toEqual(
          exemplo[chave],
        );
      }
    }
  });

  it('nenhum bloco narrativo abre com prop obrigatória vazia', () => {
    const narrativos = getCatalogEntries().filter((e) => !e.hasData);

    for (const entry of narrativos) {
      const schema = entry.definition.manifest.propsSchema as
        | { required?: string[] }
        | undefined;
      const obrigatorias = schema?.required ?? [];
      const props = initialPropsFor(
        entry.definition.manifest,
        previewPropsFor(entry.type),
      );

      for (const chave of obrigatorias) {
        expect(props[chave], `${entry.type}.${chave} abre vazio`).not.toBe('');
        expect(props[chave], `${entry.type}.${chave} abre indefinido`).toBeDefined();
      }
    }
  });
});
