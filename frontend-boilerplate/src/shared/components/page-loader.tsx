import { Skeleton } from '@/components/ui';

/**
 * Fallback de carregamento para rotas lazy (Suspense). Usado pelas features ao
 * declarar suas rotas com `React.lazy`.
 */
export function PageLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
