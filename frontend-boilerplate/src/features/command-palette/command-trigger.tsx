/**
 * Gatilho visível da paleta de comandos.
 *
 * Existe por descoberta: um atalho que ninguém vê não é usado. Mostrar o "⌘K"
 * na topbar ensina o atalho de forma passiva — o usuário clica algumas vezes,
 * memoriza a tecla e passa a usar o teclado.
 *
 * Não abre a paleta diretamente: dispara o MESMO evento de teclado que o
 * listener global escuta, mantendo uma única fonte de verdade para a abertura
 * (o gatilho vive na topbar e a paleta no shell — não compartilham estado).
 *
 * O `Kbd` resolve `mod` por plataforma (⌘ no macOS, Ctrl no resto), então não
 * há detecção de sistema operacional aqui.
 */
import { Search } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Kbd } from '@astryxdesign/core/Kbd';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';

export function CommandTrigger() {
  function open() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      label="Abrir busca e comandos"
      icon={<Icon icon={Search} />}
      onClick={open}
    >
      <HStack gap={2} vAlign="center">
        <Text type="body" color="secondary">
          Buscar…
        </Text>
        <Kbd keys="mod+k" />
      </HStack>
    </Button>
  );
}
