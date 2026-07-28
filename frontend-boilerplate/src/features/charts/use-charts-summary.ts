/**
 * Resumo do ACERVO de gráficos — quantos existem e quantos já viraram
 * evidência publicada.
 *
 * Por que não sai da lista da tela: a lista está paginada e filtrada, então
 * contar o que está na tela responderia "quantos aparecem agora", que é outra
 * pergunta. O resumo tem que falar do acervo INTEIRO, senão o número muda
 * quando o usuário digita na busca — e um indicador que se mexe sozinho não é
 * indicador.
 *
 * Custo: duas requisições de `pageSize: 1`. Só o `total` do envelope interessa,
 * então o servidor não devolve linha nenhuma de verdade. O TanStack ainda
 * deduplica com a listagem quando os parâmetros coincidem.
 *
 * Rascunhos saem por subtração (total − publicados): um terceiro `GET` só para
 * `status=DRAFT` seria uma viagem de rede para uma conta que já temos.
 */
import { useCharts } from './hooks';

export interface ChartsSummary {
  total: number;
  published: number;
  drafts: number;
  isLoading: boolean;
  /** Alguma das contagens falhou — a faixa não pode AFIRMAR números. */
  isError: boolean;
}

export function useChartsSummary(): ChartsSummary {
  const all = useCharts({ page: 1, pageSize: 1 });
  const published = useCharts({ page: 1, pageSize: 1, status: 'PUBLISHED' });

  const total = all.data?.total ?? 0;
  const publishedTotal = published.data?.total ?? 0;

  return {
    total,
    published: publishedTotal,
    // `Math.max` é rede de segurança: as duas contagens vêm de requisições
    // diferentes e podem chegar defasadas por um instante. Um "-1 rascunho"
    // piscando na tela destruiria a confiança no número inteiro.
    drafts: Math.max(total - publishedTotal, 0),
    isLoading: all.isLoading || published.isLoading,
    isError: all.isError || published.isError,
  };
}
