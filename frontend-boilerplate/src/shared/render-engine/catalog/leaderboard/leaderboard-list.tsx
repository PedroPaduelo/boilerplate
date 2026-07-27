/**
 * COMPONENTE PRÓPRIO DO BLOCO — por que existe: um ranking de PESSOAS não é a
 * mesma coisa que um ranking de categorias. O `BarList` da base resolve "quanto
 * cada categoria somou"; aqui a linha precisa de posição e identidade (avatar +
 * nome) antes do número, que é o que faz alguém se reconhecer numa lista.
 * Nenhum componente do Astryx ou da base entrega essa linha.
 *
 * O que foi reaproveitado: `Avatar`/`Text` do design system e o `ChartBarTrack`
 * da base para a barra proporcional (mesma marca de dado usada nos rankings do
 * app, com cor de token). A lista é `<ol>` de verdade — leitor de tela anuncia
 * a posição sem depender do número desenhado.
 *
 * Só o bloco `leaderboard` usa; se um segundo bloco precisar, a regra da trilha
 * manda promovê-lo para `@/shared/ui`.
 */
import { Avatar } from '@astryxdesign/core/Avatar';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartBarTrack, useChartPalette } from '@/shared/ui';

/** Uma linha do ranking. */
export interface LeaderboardEntry {
  /** Chave estável da linha. */
  key: string;
  /** Nome exibido (também vira as iniciais do avatar). */
  name: string;
  /** Valor JÁ formatado, exibido à direita. */
  value: string;
  /** Proporção em relação ao líder, de 0 a 1. */
  ratio: number;
}

export interface LeaderboardListProps {
  /** Linhas, da primeira posição para a última. */
  items: LeaderboardEntry[];
}

/** Largura da coluna de posição — mantém o nome alinhado com 1 ou 2 dígitos. */
const RANK_WIDTH = 24;

/** Ranking com posição, identidade e barra proporcional ao líder. */
export function LeaderboardList({ items }: LeaderboardListProps) {
  const palette = useChartPalette();
  if (items.length === 0) return null;

  return (
    <VStack as="ol" gap={3} width="100%" data-slot="leaderboard-list">
      {items.map((item, index) => (
        <HStack as="li" key={item.key} gap={3} vAlign="center">
          <HStack width={RANK_WIDTH} hAlign="end">
            <Text type="supporting" color="secondary" hasTabularNumbers>
              {index + 1}
            </Text>
          </HStack>

          <Avatar name={item.name} size="sm" />

          <VStack gap={1} width="100%">
            <HStack gap={2} hAlign="between" vAlign="center">
              <Text type="supporting" maxLines={1}>
                {item.name}
              </Text>
              <Text type="supporting" weight="medium" hasTabularNumbers>
                {item.value}
              </Text>
            </HStack>
            <ChartBarTrack ratio={item.ratio} color={palette.varAt(0)} />
          </VStack>
        </HStack>
      ))}
    </VStack>
  );
}
