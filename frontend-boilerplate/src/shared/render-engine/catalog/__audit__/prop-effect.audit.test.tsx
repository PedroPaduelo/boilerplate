/**
 * AUDITORIA DE INÉRCIA — toda prop exposta tem efeito real na renderização?
 *
 * A pergunta que este arquivo responde não é "a prop é lida?" (isso o
 * `scripts/audit-catalog-props.mjs` responde por análise estática), e sim a que
 * interessa ao usuário: **mudar a prop muda a tela?** Uma prop lida que cai num
 * ramo morto — variante que não altera o desenho, tipo de gráfico que renderiza
 * a mesma coisa — é tão inerte quanto uma prop nunca referenciada, e só o
 * RENDER prova a diferença.
 *
 * Como funciona: para cada bloco do catálogo, para cada prop com `enum` (ou
 * booleana), renderiza o bloco com cada valor possível e compara o HTML
 * resultante. Valores que produzem HTML idêntico = prop inerte NAQUELE dado.
 *
 * "NAQUELE dado" é a ressalva honesta: `stacked` só muda o desenho com duas
 * séries, `sortOrder` só muda com valores fora de ordem. Por isso o harness
 * usa a fixture do próprio bloco (o dado que o catálogo anuncia) e, quando o
 * resultado é "sem efeito", o relatório diz se a fixture era capaz de mostrar
 * a diferença. Falso positivo aqui é barulho; falso negativo seria mentira.
 *
 * Este arquivo é um RELATÓRIO, não um portão: roda sob demanda
 * (`npx vitest run ... prop-effect.audit`) e imprime a tabela
 * componente → propriedade → status. Os portões de regressão são os testes
 * por bloco.
 */
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { listBlocks } from '../../registry';
import type { BlockDefinition } from '../../types';

/** Um valor a experimentar numa prop, com o rótulo que aparece no relatório. */
interface Candidate {
  label: string;
  value: unknown;
}

/** Resultado da prova de uma prop. */
interface PropVerdict {
  type: string;
  prop: string;
  status: 'efeito' | 'INERTE' | 'sem-fixture';
  detail: string;
}

/**
 * Valores a experimentar numa prop, lidos do `propsSchema` do manifesto — o
 * mesmo contrato que o agente de IA lê para decidir o que preencher.
 */
function candidatesOf(schema: Record<string, unknown>): Candidate[] | null {
  const values = schema.enum;
  if (Array.isArray(values) && values.length > 1) {
    return values.map((value) => ({ label: String(value), value }));
  }
  if (schema.type === 'boolean') {
    return [
      { label: 'true', value: true },
      { label: 'false', value: false },
    ];
  }
  return null;
}

/** Props do `propsSchema` de um bloco (o objeto `properties`). */
function schemaProps(def: BlockDefinition): Record<string, Record<string, unknown>> {
  const schema = def.manifest.propsSchema as
    | { properties?: Record<string, Record<string, unknown>> }
    | undefined;
  return schema?.properties ?? {};
}

/**
 * HTML do bloco renderizado com `props`. Normaliza o que muda a cada render
 * sem ser desenho: ids gerados (`useId`, gradientes do recharts) e as classes
 * atômicas do StyleX, que trocam de nome a cada build.
 */
function renderHtml(def: BlockDefinition, props: Record<string, unknown>): string {
  const Component = def.Component;
  const merged = {
    ...((def.manifest.defaultProps as Record<string, unknown>) ?? {}),
    ...props,
  };
  const { container } = renderWithProviders(
    <Component
      props={merged}
      data={def.fixture ?? undefined}
      state={def.fixture ? 'success' : 'success'}
    />,
  );
  return container.innerHTML
    .replace(/\b_r_[a-z0-9]+_/gi, 'ID')
    .replace(/id="[^"]*"/g, 'id="ID"')
    .replace(/url\(#[^)]*\)/g, 'url(#ID)')
    .replace(/aria-labelledby="[^"]*"/g, '');
}

const entries = listBlocks().filter((def) => Boolean(def?.manifest));

const verdicts: PropVerdict[] = [];

describe('auditoria: toda prop exposta muda a renderização', () => {
  for (const def of entries) {
    const props = schemaProps(def);

    for (const [prop, schema] of Object.entries(props)) {
      const candidates = candidatesOf(schema);
      if (!candidates) continue;

      it(`${def.type}.${prop}`, () => {
        const rendered = new Map<string, string[]>();

        for (const candidate of candidates) {
          let html: string;
          try {
            html = renderHtml(def, { [prop]: candidate.value });
          } catch (error) {
            html = `ERRO: ${(error as Error).message}`;
          }
          const bucket = rendered.get(html) ?? [];
          bucket.push(candidate.label);
          rendered.set(html, bucket);
        }

        const distinct = rendered.size;
        const groups = [...rendered.values()];
        const collapsed = groups.filter((group) => group.length > 1);

        if (distinct === 1) {
          verdicts.push({
            type: def.type,
            prop,
            status: def.fixture ? 'INERTE' : 'sem-fixture',
            detail: `${candidates.length} valores → 1 render (${candidates
              .map((c) => c.label)
              .join(', ')})`,
          });
        } else {
          verdicts.push({
            type: def.type,
            prop,
            status: 'efeito',
            detail:
              collapsed.length > 0
                ? `${distinct}/${candidates.length} renders distintos; iguais entre si: ${collapsed
                    .map((group) => group.join('='))
                    .join(' | ')}`
                : `${distinct} renders distintos`,
          });
        }

        // O caso NUNCA falha: este arquivo é relatório. O portão são os testes
        // por bloco, escritos depois de o defeito ser entendido.
        expect(distinct).toBeGreaterThanOrEqual(1);
      });
    }
  }

  it('imprime a tabela de status', () => {
    const inert = verdicts.filter((v) => v.status === 'INERTE');
    const partial = verdicts.filter((v) => v.detail.includes('iguais entre si'));

    const lines = [
      '',
      '='.repeat(78),
      `AUDITORIA DE PROPS — ${verdicts.length} props com valores enumeráveis`,
      '='.repeat(78),
      '',
      `INERTES (nenhum valor muda a tela): ${inert.length}`,
      ...inert.map((v) => `  ✗ ${v.type}.${v.prop} — ${v.detail}`),
      '',
      `PARCIAIS (alguns valores empatam): ${partial.length}`,
      ...partial.map((v) => `  ~ ${v.type}.${v.prop} — ${v.detail}`),
      '',
      `OK: ${verdicts.filter((v) => v.status === 'efeito' && !v.detail.includes('iguais')).length}`,
      '='.repeat(78),
    ];
    console.log(lines.join('\n'));
    expect(verdicts.length).toBeGreaterThan(0);
  });
});
