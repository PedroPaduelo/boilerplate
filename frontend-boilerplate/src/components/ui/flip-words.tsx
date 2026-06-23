import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/shared/lib/utils"

export interface FlipWordsProps {
  /** Lista de palavras que o componente cicla continuamente. */
  words: string[]
  /** Tempo (ms) que cada palavra permanece em tela antes de sair. */
  duration?: number
  /** Classes adicionais para o container/palavra atual. */
  className?: string
}

const WordSpan = React.memo(function WordSpan({
  word,
  wordIndex,
}: {
  word: string
  wordIndex: number
}) {
  return (
    <motion.span
      key={`${word}-${wordIndex}`}
      initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        delay: wordIndex * 0.3,
        duration: 0.3,
      }}
      className="inline-block whitespace-nowrap"
    >
      {word.split("").map((letter, letterIndex) => (
        <motion.span
          key={`${word}-${letterIndex}`}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: wordIndex * 0.3 + letterIndex * 0.05,
            duration: 0.2,
          }}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
      <span className="inline-block">{"\u00A0"}</span>
    </motion.span>
  )
})

/**
 * FlipWords — cicla palavras com animação de entrada por letra (blur + y)
 * e saída dramática (blur + scale + x + y), controlado por AnimatePresence.
 *
 * Inspirado em `flip-words` do Aceternity UI, reescrito com motion v12
 * (`motion/react`), sem "use client", sem as any, com wrapper de altura
 * mínima para evitar CLS durante a troca.
 *
 * @example
 *   <FlipWords words={["rápido", "bonito", "moderno"]} />
 */
export function FlipWords({ words, duration = 3000, className }: FlipWordsProps) {
  const [currentWord, setCurrentWord] = React.useState<string>(words[0] ?? "")
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false)

  const startAnimation = React.useCallback(() => {
    const next =
      words[words.indexOf(currentWord) + 1] ?? words[0] ?? currentWord
    setCurrentWord(next)
    setIsAnimating(true)
  }, [currentWord, words])

  React.useEffect(() => {
    if (isAnimating) return
    const timer = window.setTimeout(() => {
      startAnimation()
    }, duration)
    return () => window.clearTimeout(timer)
  }, [isAnimating, duration, startAnimation])

  return (
    <span
      data-slot="flip-words"
      className={cn(
        "relative inline-block min-h-[1.5em] align-baseline text-foreground",
        className,
      )}
    >
      <AnimatePresence
        onExitComplete={() => {
          setIsAnimating(false)
        }}
      >
        <motion.div
          key={currentWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
          exit={{
            opacity: 0,
            y: -40,
            x: 40,
            filter: "blur(8px)",
            scale: 2,
            position: "absolute",
          }}
          className="inline-block text-left"
        >
          {currentWord.split(" ").map((word, wordIndex) => (
            <WordSpan key={`${word}-${wordIndex}`} word={word} wordIndex={wordIndex} />
          ))}
        </motion.div>
      </AnimatePresence>
    </span>
  )
}
