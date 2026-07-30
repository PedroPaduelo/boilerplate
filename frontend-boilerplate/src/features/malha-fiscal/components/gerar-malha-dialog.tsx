/**
 * Gerar malha fiscal — do recorte ao lote.
 *
 * O diálogo tem DOIS momentos e um caminho só: os três passos de
 * parametrização e, depois de confirmar, a execução. A execução acontece aqui
 * dentro (e não numa tela à parte) porque quem mandou gerar precisa acompanhar
 * até o número do lote sair — fechar no meio e "avisar depois" transformaria a
 * retenção de duzentos CNPJs num evento invisível.
 *
 * `purpose="form"` impede que um clique fora jogue fora a parametrização.
 */
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FileSearch } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { HStack } from '@astryxdesign/core/Stack';
import { CRITERIOS, JANELA_PA, formatPA, nomeCriterio } from '../lib/dominio';
import { useGerarMalha } from '../use-gerar-malha';
import type { EscopoMalha, MalhaGerada, ParametrosMalha } from '../types';
import { ExecucaoProgresso } from './execucao-progresso';
import { PassoEquipe, PassoLote, PassoRevisao } from './gerar-malha-passos';

export interface GerarMalhaDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** O recorte selecionado nos gráficos — vira o escopo do lote. */
  escopo: EscopoMalha;
  totalRecorte: number;
  diferencaRecorte: number;
  /** Avisa a página qual lote nasceu, para destacá-lo na listagem. */
  onGerada: (malha: MalhaGerada) => void;
}

const TITULOS = [
  'Passo 1 de 3 · O que será fiscalizado',
  'Passo 2 de 3 · Equipe e prazos',
  'Passo 3 de 3 · Conferência',
];

/**
 * Parâmetros iniciais a partir do recorte: o clique no gráfico já respondeu
 * critério e competência, então o formulário abre preenchido — repetir a mão
 * o que a pessoa acabou de escolher é pedir para ela errar.
 */
function parametrosPadrao(escopo: EscopoMalha, quantidade: number): ParametrosMalha {
  const criterio = escopo.criterio ?? CRITERIOS[0].id;
  const paInicial = escopo.competencia ?? JANELA_PA[0];
  const paFinal = escopo.competencia ?? JANELA_PA[JANELA_PA.length - 1];

  return {
    nome: `${nomeCriterio(criterio)} — ${formatPA(paInicial)} a ${formatPA(paFinal)}`,
    criterio,
    paInicial,
    paFinal,
    quantidadeOptantes: quantidade,
    equipeId: 'ef-1',
    ordenacao: 'maior-diferenca',
    prazoCiencia: 30,
    escopo,
  };
}

/** Teto sugerido: o menor degrau que cobre o recorte inteiro. */
function quantidadeSugerida(total: number): number {
  const degraus = [30, 50, 100, 150, 200, 300];
  return degraus.find((degrau) => degrau >= total) ?? 300;
}

export function GerarMalhaDialog({
  isOpen,
  onOpenChange,
  escopo,
  totalRecorte,
  diferencaRecorte,
  onGerada,
}: GerarMalhaDialogProps) {
  const [passo, setPasso] = useState(0);
  const [parametros, setParametros] = useState<ParametrosMalha>(() =>
    parametrosPadrao(escopo, quantidadeSugerida(totalRecorte)),
  );
  const geracao = useGerarMalha();

  // Cada abertura parte do recorte ATUAL: o diálogo não pode reabrir com os
  // parâmetros da fiscalização anterior.
  useEffect(() => {
    if (!isOpen) return;
    setPasso(0);
    setParametros(parametrosPadrao(escopo, quantidadeSugerida(totalRecorte)));
    // `escopo`/`totalRecorte` mudam a cada clique no gráfico; reagir a eles com
    // o diálogo ABERTO apagaria o que a pessoa está preenchendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const emExecucao = geracao.isGerando;
  const concluido = geracao.malhaCriada !== null;

  const fechar = () => {
    if (emExecucao) return;
    if (geracao.malhaCriada) onGerada(geracao.malhaCriada);
    geracao.reiniciar();
    onOpenChange(false);
  };

  const titulo = emExecucao || concluido ? 'Gerando a malha fiscal' : 'Gerar malha fiscal';
  const subtitulo =
    emExecucao || concluido
      ? 'O lote está sendo apurado sobre a base de optantes.'
      : TITULOS[passo];

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) fechar();
      }}
      width={720}
      purpose="form"
    >
      <Layout
        header={
          <DialogHeader
            title={titulo}
            subtitle={subtitulo}
            onOpenChange={(open) => {
              if (!open) fechar();
            }}
            hasDivider
          />
        }
        content={
          <LayoutContent isScrollable padding={4}>
            {emExecucao || concluido ? (
              <ExecucaoProgresso
                etapaAtual={geracao.estado.etapaAtual}
                progresso={geracao.estado.progresso}
                registros={geracao.estado.registros}
                malha={geracao.malhaCriada}
              />
            ) : passo === 0 ? (
              <PassoLote parametros={parametros} onChange={setParametros} />
            ) : passo === 1 ? (
              <PassoEquipe parametros={parametros} onChange={setParametros} />
            ) : (
              <PassoRevisao
                parametros={parametros}
                totalRecorte={totalRecorte}
                diferencaRecorte={diferencaRecorte}
              />
            )}
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider padding={3}>
            <HStack gap={2} hAlign="end">
              {concluido ? (
                <Button variant="primary" label="Concluir" onClick={fechar} />
              ) : (
                <>
                  <Button
                    label={passo === 0 ? 'Cancelar' : 'Voltar'}
                    icon={passo === 0 ? undefined : <Icon icon={ArrowLeft} />}
                    isDisabled={emExecucao}
                    onClick={() => (passo === 0 ? fechar() : setPasso(passo - 1))}
                  />
                  {passo < 2 ? (
                    <Button
                      variant="primary"
                      label="Continuar"
                      icon={<Icon icon={ArrowRight} />}
                      onClick={() => setPasso(passo + 1)}
                    />
                  ) : (
                    <Button
                      variant="primary"
                      label="Gerar malha"
                      icon={<Icon icon={FileSearch} />}
                      isLoading={emExecucao}
                      onClick={() => geracao.gerar(parametros)}
                    />
                  )}
                </>
              )}
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
