/** Indicador de "pensando/digitando" (três pontinhos animados). */
export function ThinkingIndicator() {
  return (
    <div
      data-slot="chat-thinking"
      role="status"
      aria-label="O agente está digitando"
      className="flex items-center gap-1 px-1 py-2"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
