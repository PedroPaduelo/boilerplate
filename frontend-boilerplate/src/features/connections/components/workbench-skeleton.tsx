import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';

/**
 * Esqueleto do workbench — imita a moldura real (cabeçalho, navegador e
 * detalhe) para a tela não “pular” quando os dados chegam. Nunca tela em
 * branco.
 */
export function WorkbenchSkeleton() {
  return (
    <VStack gap={2} padding={3} height="100%" aria-busy="true">
      <Skeleton width="100%" height={40} radius={2} />
      <HStack gap={2}>
        <VStack gap={1} width={280}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} index={index} width="100%" height={24} radius={1} />
          ))}
        </VStack>
        <VStack gap={2} width="100%">
          <Skeleton width="100%" height={72} radius={2} />
          <Skeleton width="100%" height={240} radius={2} />
        </VStack>
      </HStack>
    </VStack>
  );
}
