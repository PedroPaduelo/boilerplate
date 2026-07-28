/**
 * COMPONENTE PRÓPRIO — o irmão do `KpiCard` na grade de indicadores. Existe
 * porque um painel tem DUAS entradas para o mesmo widget: o indicador
 * principal, que abre a tela, e o dado de apoio, que aparece em fileiras de
 * quatro ou seis. Cada um chega com o seu vocabulário de props (o KPI fala de
 * `icon` e formato automático; o ladrilho, de `hint` e número compacto).
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE NÃO É MAIS "UM DEGRAU MENOR"
 * ---------------------------------------------------------------------------
 * A versão anterior reduzia a tipografia para marcar hierarquia. A referência
 * (`04-widgets-prontos.md` §2) não tem essa segunda escala: ela descreve UM
 * card de resumo e, em §2.4, quatro variações dele que mudam apenas o
 * mini-gráfico — nunca o tamanho do título ou do valor. Duas escalas de card
 * de resumo convivendo no mesmo painel era justamente o que fazia dois
 * indicadores iguais parecerem coisas diferentes.
 *
 * Então o ladrilho passa a ser o MESMO card, e a hierarquia volta a ser dada
 * por onde ele está e quantos cabem na linha — que é como a referência a
 * resolve. A composição inteira vem de `KpiCard`; aqui ficam só o contrato de
 * props e os defaults do ladrilho.
 *
 * A decisão está registrada em `docs/charts/NOTAS.md` (SUB-10).
 */
import type { ReactNode } from 'react';
import type { CardProps } from '@astryxdesign/core/Card';
import type { ChartScope } from './charts';
import { KpiCard, type KpiCardState } from './kpi-card';

export interface StatTileProps {
  /** Nome da estatística (ex.: "Eventos hoje"). Aceita Markdown e `{{var}}`. */
  label: string;
  /** Valor numérico — anima dígito a dígito quando muda. */
  value?: number;
  /** Valor JÁ formatado. Vence `value`/`prefix`/`suffix`. */
  displayValue?: string;
  /** Prefixo colado no número. */
  prefix?: string;
  /** Unidade colada no número. Aceita Markdown e `{{variavel}}`. */
  suffix?: string;
  /** Variação percentual vs. período anterior. */
  delta?: number;
  /** Texto ao lado da variação. Aceita Markdown e `{{variavel}}`. */
  hint?: string;
  /** Força a direção da variação. */
  trend?: 'up' | 'down';
  /** Se subir é bom (inverte a cor da variação quando `false`). */
  higherIsBetter?: boolean;
  /** Ícone do topo — passe o `Icon` do DS já montado (caixa de 48×48). */
  icon?: ReactNode;
  /** Cor de categorização do ladrilho (variantes do `Card` do DS). */
  variant?: CardProps['variant'];
  /** Estado do ladrilho. Tem prioridade sobre `isLoading`/`isEmpty`. */
  state?: KpiCardState;
  /** Troca o valor por `Skeleton` (atalho de `state="loading"`). */
  isLoading?: boolean;
  /** Sem dados (atalho de `state="empty"`). */
  isEmpty?: boolean;
  /** Mensagem do estado vazio. Aceita Markdown e `{{variavel}}`. */
  emptyMessage?: string;
  /** Detalhe do erro, exibido quando `state="error"`. */
  error?: string;
  /** Escopo de interpolação das `{{variaveis}}` (de `buildChartScope`). */
  scope?: ChartScope;
  /** Mini-gráfico de 84×56 à direita do texto (§2.2 da referência). */
  media?: ReactNode;
}

/** Ladrilho de estatística — o card de resumo da referência, em fileira. */
export function StatTile({ hint, ...props }: StatTileProps) {
  return (
    <KpiCard
      {...props}
      slot="stat-tile"
      // O KPI assume "vs. período anterior" quando ninguém diz nada; o
      // ladrilho não assume — a string vazia é o jeito de dizer "sem texto"
      // sem reintroduzir o default do irmão.
      hint={hint ?? ''}
    />
  );
}
