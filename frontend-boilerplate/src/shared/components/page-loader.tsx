import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * Fallback de carregamento das rotas lazy (Suspense), usado pelas features ao
 * declarar rotas com `React.lazy`.
 *
 * Esqueleto em vez de spinner: a rota que está chegando é uma PÁGINA (título +
 * conteúdo), então reservar o espaço no formato certo evita o salto de layout
 * quando o bundle resolve. O `role="status"` faz o leitor de tela anunciar que
 * algo está carregando — um esqueleto silencioso é uma tela em branco para
 * quem não enxerga.
 */
export function PageLoader() {
  return (
    <VStack gap={4} role="status" aria-label="Carregando a página">
      <Skeleton width={192} height={32} radius={2} />
      <Skeleton width="100%" height={256} radius={3} index={1} />
    </VStack>
  );
}
