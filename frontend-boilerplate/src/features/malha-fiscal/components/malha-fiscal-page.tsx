/**
 * Malha fiscal (`/malha-fiscal`) — do gráfico à campanha de auditoria.
 *
 * A tela responde quatro perguntas, na ordem em que a fiscalização as faz:
 *   1. Qual o tamanho do problema?  → indicadores
 *   2. Onde ele está?               → gráficos (e o clique que vira recorte)
 *   3. Quem exatamente cai nele?    → lista de contribuintes retidos
 *   4. O que já está sendo feito?   → campanhas em execução
 *
 * Aqui só há ORQUESTRAÇÃO: o recorte é o único estado que a página guarda, e
 * ele é a chave de cache das três consultas. Cada pedaço da tela é um
 * componente próprio e recebe dado por prop.
 */
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Stack';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { useMalhas, usePainelMalha, useRetidos } from '../hooks';
import type { EscopoMalha, MalhaGerada } from '../types';
import { GerarMalhaDialog } from './gerar-malha-dialog';
import { MalhaEscopo } from './malha-escopo';
import { MalhaGraficos } from './malha-graficos';
import { MalhaHeader } from './malha-header';
import { MalhaKpis } from './malha-kpis';
import { MalhasTable } from './malhas-table';
import { RetidosTable } from './retidos-table';

export function MalhaFiscalPage() {
  const role = useAuthStore((state) => state.user?.role);
  // RBAC de UI (o backend continua sendo a autoridade): consultar a malha é
  // leitura; abrir lote de fiscalização é ação sobre contribuinte.
  const canGerar = hasPermission(role, 'artifacts:manage');

  const [escopo, setEscopo] = useState<EscopoMalha>({});
  const [termo, setTermo] = useState('');
  const [isDialogAberto, setDialogAberto] = useState(false);
  const [destaqueId, setDestaqueId] = useState<string | null>(null);

  const painel = usePainelMalha(escopo);
  const retidos = useRetidos(escopo, termo);
  const malhas = useMalhas();

  /**
   * Clique numa série: aplica a dimensão — e a REMOVE se o mesmo valor for
   * clicado de novo. Sem isso, o único jeito de desfazer um clique errado
   * seria limpar o recorte inteiro.
   */
  const alternar = (patch: EscopoMalha) => {
    setEscopo((atual) => ({
      ...atual,
      ...(patch.criterio !== undefined && {
        criterio: atual.criterio === patch.criterio ? undefined : patch.criterio,
      }),
      ...(patch.competencia !== undefined && {
        competencia: atual.competencia === patch.competencia ? undefined : patch.competencia,
      }),
      ...(patch.faixa !== undefined && {
        faixa: atual.faixa === patch.faixa ? undefined : patch.faixa,
      }),
    }));
  };

  const handleGerada = (malha: MalhaGerada) => {
    setDestaqueId(malha.id);
  };

  return (
    <VStack gap={6}>
      <MalhaHeader
        atualizadoEm={painel.data?.atualizadoEm}
        registrosAnalisados={painel.data?.registrosAnalisados}
        isFetching={painel.isFetching}
        onAtualizar={() => void painel.refetch()}
      />

      {painel.isError ? (
        // Erro não é vazio: a tela não está sem dados, está sem resposta da
        // base — e a saída é tentar de novo, não mexer no recorte.
        <Banner
          status="error"
          title="Não foi possível apurar a malha"
          description="A base de cruzamento não respondeu. Nenhum número desta tela pode ser considerado."
          endContent={
            <Button
              label="Tentar de novo"
              size="sm"
              icon={<Icon icon={RefreshCw} />}
              onClick={() => void painel.refetch()}
            />
          }
        />
      ) : null}

      <MalhaKpis
        resumo={painel.data?.resumo}
        isLoading={painel.isLoading || painel.isFetching}
      />

      <MalhaGraficos
        painel={painel.data}
        isLoading={painel.isLoading}
        onAlternar={alternar}
      />

      <MalhaEscopo
        escopo={escopo}
        onChange={setEscopo}
        total={retidos.data?.total}
        diferenca={retidos.data?.diferencaTotal}
        isLoading={retidos.isFetching}
        canGerar={canGerar}
        onGerar={() => setDialogAberto(true)}
      />

      <RetidosTable
        itens={retidos.data?.itens ?? []}
        total={retidos.data?.total}
        termo={termo}
        onTermoChange={setTermo}
        isLoading={retidos.isFetching}
      />

      <MalhasTable
        malhas={malhas.data ?? []}
        isLoading={malhas.isLoading}
        destaqueId={destaqueId}
      />

      <GerarMalhaDialog
        isOpen={isDialogAberto}
        onOpenChange={setDialogAberto}
        escopo={escopo}
        totalRecorte={retidos.data?.total ?? 0}
        diferencaRecorte={retidos.data?.diferencaTotal ?? 0}
        onGerada={handleGerada}
      />
    </VStack>
  );
}
