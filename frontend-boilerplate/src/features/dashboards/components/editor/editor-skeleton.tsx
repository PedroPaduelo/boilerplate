/**
 * Esqueleto do editor com a SILHUETA da tela: trilha, cabeçalho, barra de
 * ações, título e as duas colunas. Nunca uma tela em branco — e nunca um
 * retângulo genérico, que faria o conteúdo "pular" quando chegasse.
 */
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';

export function EditorSkeleton() {
  return (
    <VStack gap={4} aria-busy="true" aria-label="Carregando editor do dashboard">
      <Skeleton width={260} height={20} />
      <Skeleton width={320} height={32} index={1} />
      <Skeleton height={56} index={2} />
      <Skeleton width={420} height={56} index={3} />

      <Grid columns={{ minWidth: 380, max: 2 }} gap={5} align="start">
        <VStack gap={3}>
          <Skeleton height={96} index={4} />
          <Skeleton height={180} index={5} />
        </VStack>
        <Skeleton height={288} index={6} />
      </Grid>
    </VStack>
  );
}
