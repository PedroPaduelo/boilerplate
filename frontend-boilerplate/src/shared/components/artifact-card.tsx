import { Fragment } from 'react';
import { AlertTriangle, MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
  Button,
  Card,
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

/** Cor do ponto de status. Cor é reservada para SIGNIFICADO, não decoração. */
function statusDot(status: string) {
  return status === 'PUBLISHED'
    ? { label: 'Publicado', dot: 'bg-chart-2', text: 'text-foreground/70' }
    : { label: 'Rascunho', dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' };
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
 * TRANSFORMA em um painel de confirmação (sem modal/overlay), evitando o bug
 * do `react-remove-scroll` que deixava o `<body>` com `pointer-events: none`
 * após fechar o Radix `AlertDialog`.
 */
export interface ArtifactCardConfirming {
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export interface ArtifactCardProps {
  title: string;
  icon: LucideIcon;
  status: string;
  visibility: string;
  metaPrimary?: string;
  metaSecondary?: string;
  updatedAt: string;
  onOpen: () => void;
  onPrefetch?: () => void;
  openLabel?: string;
  actions: ArtifactCardAction[];
  confirming?: ArtifactCardConfirming;
}

/**
 * Card de artefato (dashboard ou gráfico) das telas de listagem.
 *
 * Decisões de design (derivadas do benchmark com Linear/Vercel e da tendência
 * 2026 de "minimal chrome, maximum data"):
 *
 * 1. O CARD INTEIRO é clicável. Antes, só um botão "Abrir" no rodapé abria o
 *    artefato — o alvo era pequeno e o card parecia clicável sem ser. Aqui o
 *    botão do título projeta um `::after` sobre todo o card, o que dá uma
 *    área de clique grande MANTENDO um único ponto de foco no teclado (o
 *    padrão de "card com link expandido" usado por GitHub e Linear).
 * 2. Status vira um PONTO colorido em vez de duas pílulas. Cor passa a
 *    significar estado, não decorar — grades de pílulas coloridas viraram
 *    ruído visual e datam a interface.
 * 3. Sem sombra em repouso: borda hairline e, no hover, a borda assume a cor
 *    da marca com um leve halo. Elevação por sombra pesada foi substituída
 *    por contraste de borda (padrão Vercel).
 * 4. O menu "…" só aparece no hover/foco em telas grandes, reduzindo ruído
 *    numa grade com dezenas de cards; em toque permanece sempre visível.
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
  // MODO DE CONFIRMAÇÃO — substitui todo o conteúdo, sem portal nem overlay.
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
  const st = statusDot(status);
  const hasMenu = actions.length > 0;
  const meta = [metaPrimary, metaSecondary].filter(Boolean).join(' · ');

  return (
    <div
      // Mantém a convenção de slot do design system (`card`): este container
      // substitui o <Card> anterior e continua sendo, para todos os efeitos,
      // o elemento "card" — inclusive para quem consulta o DOM.
      data-slot="card"
      data-artifact-card=""
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4',
        'transition-[border-color,background-color,box-shadow] duration-200',
        // Halo sutil na cor da marca via color-mix (em vez de sombra pesada).
        'hover:border-primary/40 hover:bg-accent/40',
        'hover:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_12%,transparent)]',
        'focus-within:border-primary/50',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            'bg-muted text-muted-foreground transition-colors',
            'group-hover:bg-primary/10 group-hover:text-primary',
          )}
        >
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          {/* O ::after cobre o card inteiro = área de clique grande com um
              único ponto de tabulação. O menu fica acima via z-10. */}
          <button
            type="button"
            onClick={onOpen}
            aria-label={`${openLabel} ${title}`}
            className={cn(
              'block max-w-full truncate text-left text-sm font-medium leading-tight text-foreground',
              'after:absolute after:inset-0 after:rounded-xl after:content-[""]',
              'outline-none focus-visible:underline focus-visible:decoration-primary focus-visible:underline-offset-4',
            )}
            title={title}
          >
            {title}
          </button>
          {meta ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
          ) : null}
        </div>

        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Ações de ${title}`}
                className={cn(
                  'relative z-10 -mr-1 -mt-1 shrink-0 text-muted-foreground',
                  'md:opacity-0 md:transition-opacity',
                  'md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100',
                )}
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

      {/* Rodapé de metadados: status por PONTO + visibilidade + data em mono
          (números tabulares alinham entre cards vizinhos na grade). */}
      <div className="flex items-center gap-2 text-xs">
        <span className={cn('flex items-center gap-1.5', st.text)}>
          <span className={cn('size-1.5 rounded-full', st.dot)} aria-hidden />
          {st.label}
        </span>
        <span className="text-border" aria-hidden>
          |
        </span>
        <span className="truncate text-muted-foreground">
          {VISIBILITY_LABEL[visibility] ?? visibility}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/80">
          {formatDateTime(updatedAt)}
        </span>
      </div>
    </div>
  );
}
