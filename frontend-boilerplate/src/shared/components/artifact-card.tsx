import { Fragment } from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
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
}

/**
 * Card genérico de artefato (dashboard ou gráfico) para as telas de listagem.
 * Presentacional e agnóstico de feature: recebe os dados já mapeados e a lista
 * de ações (já filtradas por RBAC pelo chamador).
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
}: ArtifactCardProps) {
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
