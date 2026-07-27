/**
 * Estado EDITÁVEL do playground: props visuais + cabeçalho/rodapé do
 * `ChartWidget` (título, subtítulo, query, duração, linhas de explicação).
 *
 * Um único objeto de estado (em vez de sete `useState`) porque o snapshot
 * reportado para a tela do gráfico é justamente esse objeto — assim ele muda
 * de referência uma vez por edição, e não uma vez por campo.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlockManifest } from '@dashboards/contracts';
import { initialPropsFor } from './playground-helpers';
import type { PlaygroundConfig, PlaygroundSeed, Takeaway } from './types';

/** Uma linha vazia por padrão: o editor já abre com algo para preencher. */
const EMPTY_TAKEAWAYS: Takeaway[] = [{ enabled: true, text: '' }];

interface UsePlaygroundConfigOptions {
  manifest: BlockManifest;
  /** Valores vindos do gráfico salvo (`/charts/:id`). */
  seed?: PlaygroundSeed;
  /** Props narrativas de preview (ex.: texto do bloco `title`). */
  previewProps?: Record<string, unknown>;
  /** Duração real da query (modo live) — sobrescreve o campo do formulário. */
  liveDurationMs?: number;
}

export interface UsePlaygroundConfigReturn {
  config: PlaygroundConfig;
  /** Atualiza um subconjunto dos campos. */
  patch: (partial: Partial<PlaygroundConfig>) => void;
  /** Atualiza UMA prop visual do bloco. */
  setProp: (key: string, value: unknown) => void;
  /** Volta as props para `defaultProps` + semente. */
  resetProps: () => void;
  /** Zera as linhas de explicação e religa o "Mostrar SQL". */
  resetTakeaways: () => void;
}

function buildInitialConfig(
  manifest: BlockManifest,
  seed: PlaygroundSeed | undefined,
  previewProps: Record<string, unknown> | undefined,
): PlaygroundConfig {
  return {
    props: initialPropsFor(manifest, { ...(previewProps ?? {}), ...(seed?.props ?? {}) }),
    title: seed?.title ?? manifest.name,
    subtitle: seed?.subtitle ?? '',
    query: seed?.query ?? '',
    durationMs: seed?.durationMs ?? '',
    takeaways:
      seed?.takeaways && seed.takeaways.length > 0 ? seed.takeaways : EMPTY_TAKEAWAYS,
    showSql: seed?.showSql ?? true,
  };
}

export function usePlaygroundConfig({
  manifest,
  seed,
  previewProps,
  liveDurationMs,
}: UsePlaygroundConfigOptions): UsePlaygroundConfigReturn {
  const [config, setConfig] = useState<PlaygroundConfig>(() =>
    buildInitialConfig(manifest, seed, previewProps),
  );

  // A semente e as props de preview são estáveis por bloco; guardá-las numa ref
  // evita reconstruir o estado a cada render do pai (que recria os objetos).
  const initialArgs = useRef({ seed, previewProps });
  initialArgs.current = { seed, previewProps };

  // Trocar de bloco reinicia a configuração. A `key` no pai já desmonta o
  // playground, mas deixamos explícito para quem reusa o componente sem `key`.
  const type = manifest.type;
  useEffect(() => {
    setConfig(
      buildInitialConfig(
        manifest,
        initialArgs.current.seed,
        initialArgs.current.previewProps,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // No modo live a duração é medida pelo servidor — o campo vira read-only.
  useEffect(() => {
    if (liveDurationMs === undefined) return;
    setConfig((c) =>
      c.durationMs === liveDurationMs ? c : { ...c, durationMs: liveDurationMs },
    );
  }, [liveDurationMs]);

  const patch = useCallback((partial: Partial<PlaygroundConfig>) => {
    setConfig((c) => ({ ...c, ...partial }));
  }, []);

  const setProp = useCallback((key: string, value: unknown) => {
    setConfig((c) => ({ ...c, props: { ...c.props, [key]: value } }));
  }, []);

  const resetProps = useCallback(() => {
    const { seed: s, previewProps: p } = initialArgs.current;
    setConfig((c) => ({
      ...c,
      props: initialPropsFor(manifest, { ...(p ?? {}), ...(s?.props ?? {}) }),
    }));
  }, [manifest]);

  const resetTakeaways = useCallback(() => {
    setConfig((c) => ({ ...c, takeaways: EMPTY_TAKEAWAYS, showSql: true }));
  }, []);

  return { config, patch, setProp, resetProps, resetTakeaways };
}
