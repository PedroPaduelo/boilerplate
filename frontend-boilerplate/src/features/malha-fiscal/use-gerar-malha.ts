/**
 * A geração do lote — mutação LONGA com prestação de contas.
 *
 * Uma barra girando por sete segundos não diz nada a quem está mandando
 * fiscalizar duzentos CNPJs. Este hook guarda em qual etapa o processamento
 * está, quantos registros já foram varridos e o que cada etapa fez — é o
 * material que a tela transforma em lista com marca de concluído.
 */
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { queryKeys } from '@/shared/lib/query-keys';
import { gerarMalha } from './api';
import { ETAPAS_GERACAO } from './lib/dominio';
import type { MalhaGerada, ParametrosMalha, ProgressoGeracao } from './types';

export interface EstadoGeracao {
  /** Índice da etapa em curso; `-1` antes de começar. */
  etapaAtual: number;
  /** Fração concluída (0–1) — alimenta a barra. */
  progresso: number;
  /** Registros varridos até agora. */
  registros: number;
}

const ESTADO_INICIAL: EstadoGeracao = { etapaAtual: -1, progresso: 0, registros: 0 };

export function useGerarMalha() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [estado, setEstado] = useState<EstadoGeracao>(ESTADO_INICIAL);
  const [malhaCriada, setMalhaCriada] = useState<MalhaGerada | null>(null);

  const mutation = useMutation({
    mutationFn: (parametros: ParametrosMalha) =>
      gerarMalha(parametros, (progresso: ProgressoGeracao) =>
        setEstado({
          etapaAtual: progresso.etapaIndex,
          progresso: progresso.progresso,
          registros: progresso.registros,
        }),
      ),
    onSuccess: (malha) => {
      setMalhaCriada(malha);
      setEstado({ etapaAtual: ETAPAS_GERACAO.length, progresso: 1, registros: estado.registros });
      // A lista de campanhas abaixo do painel precisa nascer com o lote novo.
      void queryClient.invalidateQueries({ queryKey: queryKeys.malhaFiscal.malhas() });
      toast.success(`Malha ${malha.codigo} gerada com ${malha.totalContribuintes} contribuintes.`);
    },
    onError: () => {
      toast.error('Não foi possível gerar a malha. Verifique os parâmetros e tente novamente.');
    },
  });

  /** Volta ao estado inicial — usado ao fechar o diálogo. */
  const reiniciar = useCallback(() => {
    setEstado(ESTADO_INICIAL);
    setMalhaCriada(null);
    mutation.reset();
  }, [mutation]);

  return {
    estado,
    malhaCriada,
    isGerando: mutation.isPending,
    isErro: mutation.isError,
    gerar: mutation.mutate,
    reiniciar,
  };
}
