/**
 * Moldura dos gráficos desta tela: título, subtítulo e o aviso de que o desenho
 * é clicável.
 *
 * O aviso importa: gráfico que filtra sem dizer que filtra é armadilha — a
 * pessoa clica sem querer, a tela inteira muda e ela não sabe o que fez. Aqui a
 * ação é anunciada ANTES do clique, e o recorte resultante fica escrito logo
 * abaixo, na barra de escopo.
 */
import type { ReactNode } from 'react';
import { MousePointerClick } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';

export interface GraficoCardProps {
  titulo: string;
  descricao: string;
  /** Texto do aviso de clique. Ausente = o gráfico não seleciona nada. */
  acao?: string;
  children: ReactNode;
}

export function GraficoCard({ titulo, descricao, acao, children }: GraficoCardProps) {
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
            {/* `h2` é do título da página; o card entra como `h3`. */}
            <Heading level={3}>{titulo}</Heading>
            {acao ? (
              <HStack gap={1} vAlign="center">
                <Icon icon={MousePointerClick} size="sm" color="secondary" />
                <Text type="supporting">{acao}</Text>
              </HStack>
            ) : null}
          </HStack>
          <Text type="supporting">{descricao}</Text>
        </VStack>
        {children}
      </VStack>
    </Card>
  );
}
