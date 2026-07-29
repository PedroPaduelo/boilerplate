/**
 * Vazios da tela de VISUALIZAÇÃO.
 *
 * São DOIS vazios diferentes, e tratá-los como um só é o que produz aquela
 * frase inútil ("Nenhum dado") no meio de uma tela em branco:
 *
 *  • DASHBOARD NOVO — não existe nenhum bloco em lugar nenhum. Quem chega aqui
 *    não tem o que ler; tem o que CRIAR. A saída é o caminho de montagem (o
 *    agente monta a partir de uma pergunta em português, que é como este
 *    produto espera que dashboards nasçam).
 *  • ABA SEM CONTEÚDO — o dashboard tem blocos, só que não nesta aba. Aqui não
 *    falta criar nada: falta ir para uma aba que tem conteúdo. Oferecer "criar
 *    dashboard" seria responder a pergunta errada.
 *
 * A ilustração é o ÍCONE em tamanho grande do `EmptyState` do DS, e não um SVG
 * próprio: um desenho exclusivo para dois estados que quase ninguém vê é peso
 * de manutenção sem retorno — e o ícone grande já cumpre o papel de dizer "isto
 * é um estado, não um erro de carregamento".
 */
import { LayoutDashboard, MessageSquare, PanelsTopLeft } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';

export interface DashboardViewerEmptyProps {
  /**
   * `true` quando o dashboard INTEIRO está vazio (e não só a aba atual). É o
   * que decide qual das duas perguntas a tela responde.
   */
  isDashboardEmpty: boolean;
  /** Título da aba atual — usado na mensagem do vazio de aba. */
  tabTitle?: string;
  /** `false` (sem permissão de criar) troca o CTA pelo motivo. */
  canCreate: boolean;
  /** Leva ao chat com o agente para montar o dashboard. */
  onAskAgent: () => void;
}

export function DashboardViewerEmpty({
  isDashboardEmpty,
  tabTitle,
  canCreate,
  onAskAgent,
}: DashboardViewerEmptyProps) {
  if (!isDashboardEmpty) {
    return (
      <EmptyState
        data-testid="viewer-empty-tab"
        headingLevel={3}
        icon={<Icon icon={PanelsTopLeft} size="lg" />}
        title={tabTitle ? `“${tabTitle}” ainda não tem gráficos` : 'Aba sem conteúdo'}
        description="As outras abas deste dashboard têm conteúdo — use a navegação ao lado para trocar de aba."
      />
    );
  }

  return (
    <EmptyState
      data-testid="viewer-empty-dashboard"
      headingLevel={3}
      icon={<Icon icon={LayoutDashboard} size="lg" />}
      title="Este dashboard ainda está vazio"
      description={
        canCreate
          ? 'Peça ao agente para montá-lo a partir de uma pergunta em português — ele cria os gráficos, organiza em abas e publica.'
          : 'Assim que alguém adicionar gráficos a este dashboard, eles aparecem aqui.'
      }
      actions={
        canCreate ? (
          <Button
            label="Montar com IA"
            variant="primary"
            icon={<Icon icon={MessageSquare} />}
            onClick={onAskAgent}
          />
        ) : undefined
      }
    />
  );
}
