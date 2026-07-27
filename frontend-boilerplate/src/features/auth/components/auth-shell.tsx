import type { ReactNode } from 'react';
import { Center } from '@astryxdesign/core/Center';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';

export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Casca visual das telas de autenticação (login/registro).
 *
 * Login e registro são as ÚNICAS rotas fora do shell autenticado — não têm
 * TopNav nem SideNav —, então a moldura é feita aqui: `Center` resolve o
 * enquadramento vertical/horizontal e o `Card` delimita o formulário curto
 * (o caso legítimo de card: um item discreto com fronteira de interação).
 *
 * O título do card é `level={1}`: nesta rota não existe outro h1 acima dele,
 * então a hierarquia do documento começa aqui.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <Center axis="both" minHeight="100vh">
      <VStack gap={5} width="100%" maxWidth={420} padding={4}>
        <VStack gap={2} hAlign="center">
          {/* Marca: imagem de produto, sem equivalente no DS (mesmo padrão do
              `SideNavHeading` no shell — dimensão pelo atributo, não por CSS). */}
          <img src="/auditoria-logo.png" alt="auditorIA" height={32} draggable={false} />
          <Text type="supporting" display="block" justify="center">
            Pergunte aos seus dados. Receba respostas auditáveis.
          </Text>
        </VStack>

        <Card padding={6} width="100%">
          <VStack gap={5}>
            <VStack gap={1} hAlign="center">
              <Heading level={1}>{title}</Heading>
              <Text type="supporting" display="block" justify="center">
                {description}
              </Text>
            </VStack>

            {children}
          </VStack>
        </Card>

        <Text type="supporting" display="block" justify="center">
          {footer}
        </Text>
      </VStack>
    </Center>
  );
}
