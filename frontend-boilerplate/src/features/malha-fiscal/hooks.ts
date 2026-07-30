/**
 * Leitura da Malha Fiscal — TanStack Query sobre a camada `api.ts`.
 *
 * O painel usa `keepPreviousData` de propósito: ao clicar numa fatia da rosca, o
 * gráfico que recebeu o clique NÃO pode sumir enquanto o recorte é reapurado
 * — quem clicou perderia a referência do próprio gesto. Quem anuncia o trabalho
 * em curso são os indicadores e a lista (`isFetching`), não o desenho.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { hashFilters, queryKeys } from '@/shared/lib/query-keys';
import { buscarPainel, buscarRetidos, listarMalhas } from './api';
import type { EscopoMalha } from './types';

/**
 * A base de cruzamento NFS-e × PGDAS é reprocessada em lote (uma vez por
 * madrugada), não a cada segundo: refazer a consulta a cada foco de janela só
 * gastaria banco.
 */
const STALE_MS = 60_000;

/**
 * O recorte como chave de cache. `hashFilters` ordena as chaves, então
 * `{criterio, faixa}` e `{faixa, criterio}` caem na MESMA entrada — o cast
 * existe só porque o helper é genérico (`Record<string, unknown>`) e
 * `EscopoMalha` é um contrato fechado.
 */
function chaveDoEscopo(escopo: EscopoMalha): string {
  return hashFilters(escopo as Record<string, unknown>);
}

/** Indicadores + as quatro séries do recorte selecionado. */
export function usePainelMalha(escopo: EscopoMalha) {
  return useQuery({
    queryKey: queryKeys.malhaFiscal.painel(chaveDoEscopo(escopo)),
    queryFn: () => buscarPainel(escopo),
    staleTime: STALE_MS,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

/**
 * Os contribuintes do recorte. A busca é debounced: cada tecla dispararia uma
 * varredura na base inteira.
 */
export function useRetidos(escopo: EscopoMalha, termo: string) {
  const termoBuscado = useDebounce(termo, 300);

  return useQuery({
    queryKey: queryKeys.malhaFiscal.retidos(chaveDoEscopo(escopo), termoBuscado),
    queryFn: () => buscarRetidos(escopo, termoBuscado),
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}

/** As campanhas cadastradas (inclusive as geradas nesta sessão). */
export function useMalhas() {
  return useQuery({
    queryKey: queryKeys.malhaFiscal.malhas(),
    queryFn: listarMalhas,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
