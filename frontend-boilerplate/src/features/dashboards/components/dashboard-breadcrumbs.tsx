/**
 * Trilha de navegação das telas de UM dashboard (visualizar e editar).
 *
 * Substitui o antigo botão "Voltar": além de levar à listagem, informa ONDE o
 * usuário está. A navegação é por `href` — o `LinkProvider` do shell converte
 * para client-side, então nada de `navigate()` para o que é link.
 */
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';

export interface DashboardBreadcrumbsProps {
  /** Título do dashboard; ausente enquanto carrega ou em caso de erro. */
  title?: string;
  /** Quando informado junto de `current`, o título vira link para a view. */
  dashboardId?: string;
  /** Rótulo da folha atual (ex.: "Editar"). */
  current?: string;
}

export function DashboardBreadcrumbs({
  title,
  dashboardId,
  current,
}: DashboardBreadcrumbsProps) {
  const titleIsLink = Boolean(current && dashboardId);

  return (
    <Breadcrumbs label="Você está em" variant="supporting">
      <BreadcrumbItem href="/dashboards">Dashboards</BreadcrumbItem>
      {title ? (
        titleIsLink ? (
          <BreadcrumbItem href={`/dashboards/${dashboardId}`}>{title}</BreadcrumbItem>
        ) : (
          <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
        )
      ) : null}
      {current ? <BreadcrumbItem isCurrent>{current}</BreadcrumbItem> : null}
    </Breadcrumbs>
  );
}
