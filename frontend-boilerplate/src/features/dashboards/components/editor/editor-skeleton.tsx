/**
 * Esqueleto do editor com a SILHUETA da tela: trilha, cabeçalho, barra de
 * ações e as duas regiões — canvas (largo) e inspetor (400px).
 *
 * As proporções são as reais, e isso é o ponto: um esqueleto de duas colunas
 * iguais prometeria um layout que não é o que vai chegar, e o conteúdo
 * "pularia" para o lugar certo no primeiro paint. Nunca uma tela em branco, e
 * nunca um retângulo genérico.
 */
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';

export function EditorSkeleton() {
  return (
    <VStack
      gap={4}
      className="app-editor"
      aria-busy="true"
      aria-label="Carregando editor do dashboard"
    >
      <Skeleton width={260} height={20} />
      <Skeleton width={320} height={32} index={1} />
      {/* 50px é a altura real da barra de ações (ver `--app-editor-bar-h`):
          um retângulo de outra altura faria o conteúdo pular no primeiro
          paint, que é exatamente o que o esqueleto existe para evitar. */}
      <Skeleton height={50} index={2} />

      <HStack gap={5} vAlign="start" className="app-editor-shell">
        <VStack gap={4} className="app-editor-canvas">
          <Skeleton height={50} index={3} />
          {/* Uma faixa de cartões compactos e uma de gráficos: a forma mais
              comum de dashboard, nas alturas que o motor reserva. */}
          <Skeleton height={160} index={4} />
          <Skeleton height={500} index={5} />
        </VStack>
        <Skeleton width={400} height={520} index={6} />
      </HStack>
    </VStack>
  );
}
