import * as React from "react"
import { motion, AnimatePresence, type Variants } from "motion/react"

import { cn } from "@/shared/lib/utils"

/* -------------------------------------------------------------------------- */
/*                              AnimatedNumber                                 */
/* -------------------------------------------------------------------------- */
/**
 * Slot-machine number. Cada dígito é uma "strip" vertical 0..9 que rola via
 * translateY até alinhar no dígito atual, com spring suave. Caracteres não
 * numéricos (vírgula, ponto, sinal) são renderizados estáticos.
 */

function RenderStrip({ digit }: { digit: number }) {
  return (
    <motion.span
      className="flex flex-col"
      initial={false}
      // Cada dígito ocupa exatamente 1em de altura, então o deslocamento é em
      // unidades de em (não %): assim o dígito alvo encaixa perfeito na janela
      // de 1em do holder, sem sobra de line-height desalinhando.
      animate={{ y: `-${digit}em` }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="flex h-[1em] items-center justify-center leading-none tabular-nums"
        >
          {i}
        </span>
      ))}
    </motion.span>
  )
}

function SingleNumberHolder({ digit }: { digit: number }) {
  return (
    <span className="relative inline-flex h-[1em] overflow-hidden leading-none tabular-nums">
      <RenderStrip digit={digit} />
    </span>
  )
}

type AnimatedNumberProps = {
  value: number
  className?: string
}

function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const chars = String(value).split("")
  return (
    <span
      data-slot="animated-number"
      className={cn("inline-flex items-center tabular-nums", className)}
    >
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <SingleNumberHolder key={i} digit={Number(ch)} />
        ) : (
          <span
            key={i}
            className="inline-flex h-[1em] items-center leading-none"
          >
            {ch}
          </span>
        )
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                               AnimatedScore                                 */
/* -------------------------------------------------------------------------- */
/**
 * Placar com feedback de cor: ao mudar, escala (bounce) e pisca verde se o
 * valor subiu, vermelho se desceu, voltando para branco. As cores são fixas
 * (brand do efeito), por isso os exemplos usam um fundo escuro para contraste.
 */

const SCORE_NEUTRAL = "#fff"
const SCORE_UP = "#37ff1a"
const SCORE_DOWN = "#ff1a4b"

function ScoreContainer({
  value,
  goingUp,
  duration,
}: {
  value: number
  goingUp: boolean
  duration: number
}) {
  const variants: Variants = {
    initial: { scale: 1, color: SCORE_NEUTRAL },
    animate: {
      scale: [1, 1.4, 1],
      color: goingUp
        ? [SCORE_NEUTRAL, SCORE_UP, SCORE_NEUTRAL]
        : [SCORE_NEUTRAL, SCORE_DOWN, SCORE_NEUTRAL],
      transition: { duration },
    },
  }

  return (
    <motion.span
      key={value}
      className="inline-flex tabular-nums"
      variants={variants}
      initial="initial"
      animate="animate"
    >
      {value}
    </motion.span>
  )
}

type AnimatedScoreProps = {
  value: number
  duration?: number
  className?: string
}

function AnimatedScore({ value, duration = 0.2, className }: AnimatedScoreProps) {
  // Captura o valor anterior no render e só atualiza no effect, garantindo que
  // a direção (subiu/desceu) reflita a transição correta antes do efeito rodar.
  const prevRef = React.useRef(value)
  const goingUp = value >= prevRef.current

  React.useEffect(() => {
    prevRef.current = value
  }, [value])

  return (
    <span
      data-slot="animated-score"
      className={cn("inline-flex items-center tabular-nums", className)}
    >
      <AnimatePresence mode="popLayout">
        <ScoreContainer value={value} goingUp={goingUp} duration={duration} />
      </AnimatePresence>
    </span>
  )
}

export { AnimatedNumber, AnimatedScore }
export type { AnimatedNumberProps, AnimatedScoreProps }
