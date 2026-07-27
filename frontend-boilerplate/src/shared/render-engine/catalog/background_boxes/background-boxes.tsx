/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre "malha isométrica que acende no
 * hover" porque o DS não tem camada decorativa de fundo: `Grid` distribui
 * CONTEÚDO em colunas, não desenha textura, e nenhum primitivo aceita o
 * `skew`/`scale` que dá a perspectiva do efeito. Por isso vive aqui, no bloco.
 *
 * Reescrito sobre tokens: as linhas da malha usam `--color-border`, o brilho
 * de cada célula sai da rampa categórica de data-viz e o tamanho da célula é
 * múltiplo de `--spacing-8`. Zero hex, zero px solto.
 *
 * DUAS CORREÇÕES sobre o efeito legado:
 * 1. DETERMINISMO — a cor do brilho vinha de `Math.random()` DENTRO do render
 *    (instável em SSR/HMR). Agora deriva do índice da célula.
 * 2. CUSTO — eram 1200 nós com um `motion.div` cada. Agora são células simples
 *    e UM handler delegado no contêiner: só a célula sob o ponteiro re-renderiza.
 *
 * ESTILO (regra 2.3): a MOLDURA é do DS (`VStack` com `height`/`width`); o
 * DESENHO da malha — que o DS não cobre — é `div` + utility com token, nunca
 * `style` inline. Sem `style` neste arquivo.
 *
 * A11Y: a malha é decorativa (`aria-hidden`), não guarda conteúdo e não é
 * focável. Não há animação contínua — o brilho é resposta direta ao ponteiro —,
 * então `prefers-reduced-motion` não tem efeito contínuo a desligar aqui.
 */
import { memo, useCallback, useState, type PointerEvent, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';

/** Colunas (faixas verticais) e células por coluna. */
const STRIP_COUNT = 18;
const CELL_COUNT = 12;

/** Altura da tela decorativa — 7 passos de `--spacing-8`. */
const CANVAS_BLOCK_SIZE = 'calc(var(--spacing-8) * 7)';

/**
 * Célula da malha: geometria na escala de espaçamento do DS e traço em
 * `--border-width`/`--color-border`.
 */
const CELL_CLASS = [
  'relative',
  'h-[var(--spacing-8)] w-[calc(var(--spacing-8)_*_2)]',
  '[border-block-start:var(--border-width)_solid_var(--color-border)]',
  '[border-inline-end:var(--border-width)_solid_var(--color-border)]',
].join(' ');

/** Faixa vertical: fecha a malha do lado de dentro. */
const STRIP_CLASS = '[border-inline-start:var(--border-width)_solid_var(--color-border)]';

/**
 * A malha inteira: perspectiva isométrica (transformação de desenho, não medida
 * de layout) e máscara radial para ela sumir nas bordas em vez de bater na
 * moldura. `black`/`transparent` ali são palavras-chave de CSS (estêncil de
 * alfa), não cor de marca — não há token de máscara no DS. Sem `-webkit-`: o
 * piso de browser do Tailwind v4 (Safari 16.4+) já resolve `mask-image`.
 */
const MESH_CLASS = [
  'absolute top-1/2 start-1/2 flex',
  '[transform:translate(-50%,-50%)_skewX(-48deg)_skewY(14deg)_scale(0.9)]',
  '[mask-image:radial-gradient(circle_at_50%_50%,black_25%,transparent_78%)]',
].join(' ');

/** Brilho da célula — rampa categórica de data-viz do tema, em utility. */
const GLOW_CLASSES = [
  'bg-[color:var(--color-data-categorical-blue)]',
  'bg-[color:var(--color-data-categorical-pink)]',
  'bg-[color:var(--color-data-categorical-green)]',
  'bg-[color:var(--color-data-categorical-orange)]',
  'bg-[color:var(--color-data-categorical-red)]',
  'bg-[color:var(--color-data-categorical-purple)]',
  'bg-[color:var(--color-data-categorical-indigo)]',
  'bg-[color:var(--color-data-categorical-teal)]',
] as const;

/** Cor da célula, determinística pelo índice (sem `Math.random` no render). */
function glowClass(strip: number, cell: number): string {
  return GLOW_CLASSES[(strip * CELL_COUNT + cell) % GLOW_CLASSES.length];
}

/** Cruz de junção da malha, deslocada meio traço para fora da célula. */
const PLUS_CLASS = [
  'absolute inline-flex',
  'top-[calc(var(--spacing-2)_*_-1)] start-[calc(var(--spacing-3)_*_-1)]',
  'text-[color:var(--color-border-emphasized)]',
].join(' ');

const STRIPS = Array.from({ length: STRIP_COUNT }, (_, i) => i);
const CELLS = Array.from({ length: CELL_COUNT }, (_, i) => i);

function BoxCell({
  strip,
  cell,
  isActive,
}: {
  strip: number;
  cell: number;
  isActive: boolean;
}) {
  const hasPlus = strip % 2 === 0 && cell % 2 === 0;

  return (
    <div
      data-cell={`${strip}-${cell}`}
      className={isActive ? `${CELL_CLASS} ${glowClass(strip, cell)}` : CELL_CLASS}
    >
      {hasPlus ? (
        <span className={PLUS_CLASS}>
          <Icon icon={Plus} size="sm" />
        </span>
      ) : null}
    </div>
  );
}

export interface BackgroundBoxesProps {
  /** Conteúdo exibido por cima da malha (componentes do DS). */
  children: ReactNode;
}

/** Tela decorativa: malha isométrica atrás, conteúdo do DS na frente. */
function BackgroundBoxesImpl({ children }: BackgroundBoxesProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const hit = (event.target as HTMLElement | null)?.closest?.('[data-cell]');
    setActiveCell(hit instanceof HTMLElement ? (hit.dataset.cell ?? null) : null);
  }, []);

  const clear = useCallback(() => setActiveCell(null), []);

  return (
    <VStack
      data-slot="background-boxes-canvas"
      width="100%"
      height={CANVAS_BLOCK_SIZE}
      className="relative overflow-hidden rounded-[inherit]"
    >
      <div
        aria-hidden="true"
        data-slot="background-boxes"
        onPointerMove={handlePointerMove}
        onPointerLeave={clear}
        className={MESH_CLASS}
      >
        {STRIPS.map((strip) => (
          <div key={strip} className={STRIP_CLASS}>
            {CELLS.map((cell) => (
              <BoxCell
                key={cell}
                strip={strip}
                cell={cell}
                isActive={activeCell === `${strip}-${cell}`}
              />
            ))}
          </div>
        ))}
      </div>
      <VStack height="100%" className="pointer-events-none relative">
        {children}
      </VStack>
    </VStack>
  );
}

export const BackgroundBoxes = memo(BackgroundBoxesImpl);
BackgroundBoxes.displayName = 'BackgroundBoxes';
