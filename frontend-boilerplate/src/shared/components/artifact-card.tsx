import { Fragment } from 'react';
import { AlertTriangle, MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { cn, formatDateTime } from '@/shared/lib/utils';

/** Aparência da pílula de status (rascunho/publicado). */
function statusBadge(status: string) {
  return status === 'PUBLISHED'
    ? { label: 'Publicado', className: 'bg-chart-2/10 text-chart-2' }
    : { label: 'Rascunho', className: 'bg-muted text-muted-foreground' };
}

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: 'Privado',
  DEPARTMENT: 'Departamento',
  ORG: 'Organização',
};

export interface ArtifactCardAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Insere um separador ANTES desta ação. */
  separatorBefore?: boolean;
}

/**
 * Props para o modo de confirmação inline. Quando setado, o card se
 * TRANSFORMA em um painel de confirmação (sem modal/overlay) com botões
 * "Sim, excluir" e "Cancelar". Resolve definitivamente o bug do
 * `react-remove-scroll` que deixava o `<body>` com `pointer-events: none`
 * após fechar o Radix `AlertDialog`.
 */
export interface ArtifactCardConfirming {
  /** Dispara a mutação destrutiva. */
  onConfirm: () => void;
  /** Fecha o modo de confirmação sem chamar a mutação. */
  onCancel: () => void;
  /** Desabilita ambos os botões durante a request. */
  isPending?: boolean;
}

export interface ArtifactCardProps {
  title: string;
  icon: LucideIcon;
  status: string;
  visibility: string;
  /** Linha de meta primária (ex.: "Meu" ou nome do dono). */
  metaPrimary?: string;
  /** Linha de meta secundária (ex.: departamento). */
  metaSecondary?: string;
  updatedAt: string;
  /** Abrir (clique no card / botão Abrir). */
  onOpen: () => void;
  /** Disparado no hover — usado para prefetch do detalhe. */
  onPrefetch?: () => void;
  /** Rótulo do botão principal (default "Abrir"). */
  openLabel?: string;
  actions: ArtifactCardAction[];
  /**
   * Se definido, o card entra em modo de confirmação inline. O menu, o
   * badge de status e o botão "Abrir" desaparecem; o card exibe:
   *   • Ícone de aviso + texto "Excluir {title}?"
   *   • Botão "Sim, excluir" (variant destructive, disabled se isPending)
   *   • Botão "Cancelar"
   */
  confirming?: ArtifactCardConfirming;
}

/**
 * Card genérico de artefato (dashboard ou gráfico) para as telas de listagem.
 * Presentacional e agnóstico de feature: recebe os dados já mapeados e a lista
 * de ações (já filtradas por RBAC pelo chamador).
 *
 * Suporta DOIS modos mutuamente exclusivos:
 *   1. Normal — exibe o card completo + menu de ações.
 *   2. Confirmação inline — `confirming` está setado. Vira um painel de
 *      confirmação SEM modal/overlay, eliminando o bug do Radix
 *      `AlertDialog` + `react-remove-scroll` que travava a UI após delete.
 */
export function ArtifactCard({
  title,
  icon: Icon,
  status,
  visibility,
  metaPrimary,
  metaSecondary,
  updatedAt,
  onOpen,
  onPrefetch,
  openLabel = 'Abrir',
  actions,
  confirming,
}: ArtifactCardProps) {
  // MODO DE CONFIRMAÇÃO: substitui TODO o conteúdo do card por um painel
  // inline. Não usa portal, não usa overlay, não monta nada que precise
  // cleanup assíncrono.
  if (confirming) {
    return (
      <Card
        className="gap-4 border-destructive/40 bg-destructive/5 py-5"
        role="group"
        aria-label={`Confirmar exclusão de ${title}`}
        data-confirming="true"
      >
        <CardHeader className="px-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base" title={title}>
                Excluir {title}?
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="justify-end gap-2 px-5">
          <Button
            variant="outline"
            size="sm"
            onClick={confirming.onCancel}
            disabled={confirming.isPending}
            data-testid="cancel-delete"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={confirming.onConfirm}
            disabled={confirming.isPending}
            data-testid="confirm-delete"
          >
            {confirming.isPending ? 'Excluindo...' : 'Sim, excluir'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // MODO NORMAL
  const st = statusBadge(status);
  const hasMenu = actions.length > 0;

  return (
    <Card
      className="group gap-4 py-5 transition-shadow hover:shadow-md"
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <CardHeader className="px-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base" title={title}>
              {title}
            </CardTitle>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {metaPrimary}
              {metaPrimary && metaSecondary ? ' · ' : ''}
              {metaSecondary}
            </p>
          </div>
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Ações de ${title}`}
                  className="shrink-0"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {actions.map((action) => (
                  <Fragment key={action.key}>
                    {action.separatorBefore && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      variant={action.destructive ? 'destructive' : 'default'}
                      disabled={action.disabled}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (!action.disabled) action.onSelect();
                      }}
                    >
                      <action.icon />
                      {action.label}
                    </DropdownMenuItem>
                  </Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-2 px-5">
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 rounded-full border-transparent',
            st.className,
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {st.label}
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full border-border/70 text-muted-foreground"
        >
          {VISIBILITY_LABEL[visibility] ?? visibility}
        </Badge>
      </CardContent>

      <CardFooter className="justify-between gap-2 px-5">
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDateTime(updatedAt)}
        </span>
        <Button variant="outline" size="sm" onClick={onOpen}>
          {openLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
