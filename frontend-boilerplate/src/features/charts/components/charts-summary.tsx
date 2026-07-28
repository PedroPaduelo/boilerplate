/**
 * Faixa de resumo do acervo de gráficos: total, publicados e rascunhos.
 *
 * Mesma linguagem visual da faixa da tela inicial (`HomeStats`): UM container
 * com divisores, não três cards coloridos — a grade de "stat cards" com ícone
 * colorido cada é o que envelhece um painel, porque a cor vira decoração e
 * sobra a pergunta "o verde significa o quê?". Aqui a cor só aparece no ponto
 * de STATUS, que é onde ela carrega significado.
 *
 * A diferença para a tela inicial: aqui cada célula é um FILTRO, não um link.
 * O número que o usuário acabou de ler ("5 publicados") vira o recorte da
 * lista com um clique, e clicar de novo desfaz. É a menor distância entre a
 * pergunta de auditoria ("o que já é evidência?") e a resposta na tela.
 *
 * Quando a contagem falha a faixa não aparece: a listagem abaixo continua
 * funcionando, e um resumo é a última coisa que deve derrubar uma tela.
 */
import { Fragment, type ReactNode } from 'react';
import { BarChart3, FileEdit, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { Item } from '@astryxdesign/core/Item';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, StackItem } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import type { StatusFilter } from '@/shared/lib/artifact-filters';

export interface ChartsSummaryProps {
  total: number;
  published: number;
  drafts: number;
  isLoading: boolean;
  isError: boolean;
  /** Recorte de status ativo — dá o estado "selecionado" à célula. */
  activeStatus: StatusFilter;
  /** Aplica (ou desfaz) o recorte de status a partir da célula. */
  onFilterStatus: (status: StatusFilter) => void;
}

interface SummaryCell {
  key: StatusFilter;
  icon: LucideIcon;
  value: number;
  label: string;
  /** O que o número QUER dizer — o rótulo sozinho não conta a história. */
  hint: ReactNode;
}

export function ChartsSummary({
  total,
  published,
  drafts,
  isLoading,
  isError,
  activeStatus,
  onFilterStatus,
}: ChartsSummaryProps) {
  if (isError) return null;
  if (isLoading) return <ChartsSummarySkeleton />;

  const cells: SummaryCell[] = [
    {
      key: 'ALL',
      icon: BarChart3,
      value: total,
      label: 'Gráficos no acervo',
      hint: 'Tudo que você enxerga',
    },
    {
      key: 'PUBLISHED',
      icon: ShieldCheck,
      value: published,
      label: 'Publicados',
      hint: 'Prontos para virar evidência',
    },
    {
      key: 'DRAFT',
      icon: FileEdit,
      value: drafts,
      label: 'Rascunhos',
      hint: 'Ainda em análise',
    },
  ];

  return (
    <Card padding={0}>
      <HStack wrap="wrap">
        {cells.map((cell, index) => (
          <Fragment key={cell.key}>
            {index > 0 ? <Divider orientation="vertical" /> : null}
            <StackItem size="fill">
              <Item
                density="spacious"
                isSelected={activeStatus === cell.key}
                startContent={<Icon icon={cell.icon} color="secondary" />}
                label={
                  <Text type="display-3" hasTabularNumbers>
                    {cell.value}
                  </Text>
                }
                description={cell.label}
                endContent={<Text type="supporting">{cell.hint}</Text>}
                // IDEMPOTENTE de propósito: a célula SELECIONA um status, nunca
                // alterna. Duas razões. (1) A primeira célula já é o "sem
                // recorte" — desfazer é clicar em "Gráficos no acervo", que fica
                // à vista, em vez de um segundo clique que ninguém adivinha.
                // (2) O `Item` do DS dispara `onClick` duas vezes por clique
                // (botão de sobreposição + contêiner); um toggle ligaria e
                // desligaria no mesmo clique, e a faixa pareceria morta.
                onClick={() => onFilterStatus(cell.key)}
              />
            </StackItem>
          </Fragment>
        ))}
      </HStack>
    </Card>
  );
}

/** Carregando: a mesma silhueta da faixa, para os números não empurrarem a tela. */
function ChartsSummarySkeleton() {
  return (
    <Card padding={0}>
      <HStack wrap="wrap" role="status" aria-label="Carregando resumo dos gráficos">
        {Array.from({ length: 3 }).map((_, index) => (
          <Fragment key={index}>
            {index > 0 ? <Divider orientation="vertical" /> : null}
            <StackItem size="fill">
              <Item
                density="spacious"
                startContent={
                  <Skeleton width={20} height={20} radius={2} index={index} />
                }
                label={<Skeleton width={56} height={28} radius={2} index={index} />}
                description={
                  <Skeleton width={110} height={12} radius={1} index={index} />
                }
              />
            </StackItem>
          </Fragment>
        ))}
      </HStack>
    </Card>
  );
}
