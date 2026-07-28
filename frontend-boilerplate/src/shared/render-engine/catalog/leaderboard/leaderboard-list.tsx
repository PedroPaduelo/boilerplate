/**
 * COMPONENTE PRÓPRIO DO BLOCO — por que existe: um ranking de PESSOAS não é a
 * mesma coisa que um ranking de categorias. O `BarList` da base resolve "quanto
 * cada categoria somou"; aqui a linha precisa de posição e identidade (avatar +
 * nome) antes do número, que é o que faz alguém se reconhecer numa lista.
 * Nenhum componente do Astryx ou da base entrega essa linha.
 *
 * O que foi reaproveitado: `Avatar`/`Text` do design system e a `RankingBar` do
 * `BarList` — a MESMA marca de dado dos rankings do app, para que as duas
 * listas leiam igual (barra da §8: raio 2px, traço 0, altura de 30% da faixa,
 * trilho `trackLight`, hover que escurece). A lista é `<ol>` de verdade —
 * leitor de tela anuncia a posição sem depender do número desenhado.
 *
 * Só o bloco `leaderboard` usa; se um segundo bloco precisar, a regra da trilha
 * manda promovê-lo para `@/shared/ui`.
 */
import { Avatar } from '@astryxdesign/core/Avatar';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartText, useChartPalette } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';
// Import direto do módulo: `RankingBar` e a tipografia do par rótulo/valor são
// da camada de gráficos, mas o barril `@/shared/ui` é da BASE e está fechado
// para esta trilha (pedido registrado em `docs/charts/PEDIDOS-BASE.md`).
import { RANKING_TEXT, RankingBar } from '@/shared/ui';

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
  /** Escopo das `{{variaveis}}` dos textos (de `buildChartScope`). */
  scope?: ChartScope;
}

/** Largura da coluna de posição — mantém o nome alinhado com 1 ou 2 dígitos. */
const RANK_WIDTH = 24;

/** Ranking com posição, identidade e barra proporcional ao líder. */
export function LeaderboardList({ items, scope }: LeaderboardListProps) {
  const palette = useChartPalette();
  if (items.length === 0) return null;

  return (
    <VStack as="ol" gap={3} width="100%" data-slot="leaderboard-list">
      {items.map((item, index) => (
        <HStack
          as="li"
          key={item.key}
          gap={3}
          vAlign="center"
          // `group`: a linha INTEIRA é a área de hover que escurece a barra.
          className="group"
        >
          <HStack width={RANK_WIDTH} hAlign="end">
            <Text
              size={RANKING_TEXT.label}
              weight="medium"
              color="secondary"
              hasTabularNumbers
            >
              {index + 1}
            </Text>
          </HStack>

          <Avatar name={item.name} size="sm" />

          <VStack gap={1} width="100%">
            <HStack gap={2} hAlign="between" vAlign="center">
              <Text
                size={RANKING_TEXT.label}
                weight="medium"
                color="secondary"
                maxLines={1}
              >
                <ChartText value={item.name} scope={scope} />
              </Text>
              <Text size={RANKING_TEXT.value} weight="semibold" hasTabularNumbers>
                <ChartText value={item.value} scope={scope} />
              </Text>
            </HStack>
            {/*
              Série ÚNICA: a barra usa o verde escuro a 80% da referência
              (§2.1), a mesma cor que o `bar_list` usa quando não há acento.
            */}
            <RankingBar ratio={item.ratio} color={palette.primary80} />
          </VStack>
        </HStack>
      ))}
    </VStack>
  );
}
