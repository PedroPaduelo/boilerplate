/**
 * Tela de um RELATÓRIO EXTERNO aberto por dentro do app (`/dashboards/:id`).
 *
 * Na listagem o clique já vai direto para o endereço original, então esta tela
 * cobre os caminhos que passam pelo ID: paleta de comandos, "recentes" da
 * Visão geral, um link colado no chat interno. Ela existe para o item nunca
 * virar um erro ("não foi possível carregar este dashboard") só porque o
 * conteúdo não é nosso.
 *
 * NÃO redireciona sozinha, de propósito: um salto automático para fora do
 * produto assusta (a pessoa clicou num item da lista, não pediu para sair) e
 * atropela quem chegou aqui só para conferir o cadastro. A saída é explícita,
 * com o domínio de destino visível ANTES do clique.
 */
import { ExternalLink } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { externalUrlHost } from '../lib/external-dashboard';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';

export interface ExternalDashboardViewProps {
  title: string;
  externalUrl: string;
}

export function ExternalDashboardView({
  title,
  externalUrl,
}: ExternalDashboardViewProps) {
  return (
    <VStack gap={4}>
      <DashboardBreadcrumbs title={title} />
      <EmptyState
        headingLevel={2}
        icon={<Icon icon={ExternalLink} size="lg" />}
        title={title}
        description={`Este relatório é anterior à plataforma e continua sendo mantido em ${externalUrlHost(externalUrl)}. O conteúdo abre no sistema de origem, em uma nova aba.`}
        actions={
          <>
            {/*
              Botão E link com o endereço: o botão é a ação, o link deixa o
              destino copiável e visível — quem precisa mandar o relatório para
              alguém não tem que abrir a aba só para pegar a URL.
            */}
            <Button
              label="Abrir relatório"
              variant="primary"
              icon={<Icon icon={ExternalLink} />}
              onClick={() => window.open(externalUrl, '_blank', 'noopener,noreferrer')}
            />
            <Link href={externalUrl} isExternalLink isStandalone>
              {externalUrl}
            </Link>
          </>
        }
      />
    </VStack>
  );
}
