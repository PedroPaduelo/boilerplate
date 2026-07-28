/**
 * COMPONENTE PRÓPRIO — na verdade uma REGRA de leitura em cima do `Badge` do
 * Astryx. "Subiu 3%" é bom para receita e ruim para churn: quem decide a cor é
 * `higherIsBetter`, não o sinal do número. KPI e ladrilho compartilhavam esse
 * `if` duplicado (e com `bg-chart-2/10` cravado); agora ele mora aqui.
 *
 * ---------------------------------------------------------------------------
 * DUAS APARÊNCIAS, A MESMA REGRA
 * ---------------------------------------------------------------------------
 * `badge` (default) — o selo do DS. É o que listas e cartões densos usam, e é
 * o que estava aqui desde sempre: quem já consumia o componente não vê
 * diferença nenhuma.
 *
 * `trend` — o **bloco de tendência** do card de resumo
 * (`04-widgets-prontos.md` §2.2): ícone de 20px + texto de 12,25px/600, com
 * `+` no positivo. Sem chip, sem borda, sem fundo — na referência ele flutua
 * no canto superior direito do card, e um selo com fundo próprio ali brigaria
 * com o gradiente da superfície.
 *
 * A cor da aparência `trend` continua sendo a LEITURA DE NEGÓCIO, mas em tom
 * de TEXTO (`--color-success` / `--color-error`, que o tema resolve para o
 * `darker` da família no claro e o `lighter` no escuro) — e não no verde/
 * vermelho cheio do selo, que sobre a superfície pastel do card viraria
 * alarme. Perder o sinal de bom/ruim seria uma regressão de comportamento: a
 * referência desenha a seta sem cor porque o produto dela não tem essa regra.
 */
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';

/** Como a variação se apresenta: selo do DS ou bloco de tendência do card. */
export type DeltaBadgeAppearance = 'badge' | 'trend';

export interface DeltaBadgeProps {
  /** Variação percentual em relação ao período anterior. */
  value: number;
  /** Se subir é bom. Quando `false`, uma alta é sinalizada como piora. */
  higherIsBetter?: boolean;
  /** Força a direção. Sem isto, deriva do sinal de `value`. */
  trend?: 'up' | 'down';
  /** Formata o rótulo. Sem isto, usa `+3,2%` / `-1,4%` em pt-BR. */
  format?: (value: number) => string;
  /**
   * Aparência. `badge` (default) mantém o selo do DS; `trend` desenha o bloco
   * de tendência do card de resumo (§04-2.2): seta de 20px + 12,25px/600.
   */
  appearance?: DeltaBadgeAppearance;
}

/** Formata a variação com sinal explícito e uma casa decimal, em pt-BR. */
function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })}%`;
}

/** Selo de variação, colorido pela LEITURA de negócio (não pelo sinal). */
export function DeltaBadge({
  value,
  higherIsBetter = true,
  trend,
  format = formatDelta,
  appearance = 'badge',
}: DeltaBadgeProps) {
  const isUp = trend ? trend === 'up' : value >= 0;
  const isGood = isUp === higherIsBetter;

  if (appearance === 'trend') {
    return (
      <HStack
        // 4px entre a seta e o número — §04-2.2.
        gap={1}
        vAlign="center"
        data-slot="delta-badge"
        data-appearance="trend"
        data-variant={isGood ? 'success' : 'error'}
        // Cor de TEXTO do sinal: slot semântico do tema (resolve para o tom
        // `darker` da família no claro e o `lighter` no escuro). Fica no
        // contêiner para que seta e número usem o mesmo `currentColor`.
        style={{ color: isGood ? 'var(--color-success)' : 'var(--color-error)' }}
      >
        {/* `size="md"` é o passo de 20px do DS — a medida da referência. */}
        <Icon icon={isUp ? TrendingUp : TrendingDown} size="md" color="inherit" />
        {/* `label` = subtitle2 do tema = 12,25px/600, o tipo da referência. */}
        <Text type="label" color="inherit" hasTabularNumbers>
          {format(value)}
        </Text>
      </HStack>
    );
  }

  return (
    <Badge
      variant={isGood ? 'success' : 'error'}
      label={format(value)}
      icon={<Icon icon={isUp ? ArrowUpRight : ArrowDownRight} size="xsm" />}
      data-slot="delta-badge"
    />
  );
}
