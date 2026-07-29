import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useAuthStore } from '@/features/auth/store';

interface UserMenuProps {
  /**
   * Forma compacta: só o avatar. É o que cabe na barra recolhida (88px), onde
   * o nome do usuário não entra.
   */
  isCompact?: boolean;
}

/**
 * Menu da conta, ancorado no rodapé da navegação.
 *
 * Devolve o gatilho e nada mais: margem, linha de separação da lista e
 * centragem na forma mini são do `.app-nav-sidebar__footer` — ENQUADRAMENTO é
 * da barra, e é ela quem sabe quanto vale um respiro em 300px e em 88px. Aqui
 * dentro decide-se só o CONTEÚDO.
 *
 * `isIconOnly` não é "esconder o nome": o `Button` do DS promove o `label` a
 * `aria-label` quando ele está ligado (`Button.tsx:346-350`). O nome continua
 * sendo o nome ACESSÍVEL do controle — quem usa leitor de tela ouve
 * "Ana Souza, menu", não "botão". O que sai da tela é só o texto redundante ao
 * lado de um avatar que já mostra as iniciais.
 *
 * Na gaveta do mobile este mesmo rodapé aparece (a gaveta deixa de fora a
 * CAIXA, não as zonas), então o caminho de sair do sistema é o mesmo em toda
 * largura de tela — não há segunda cópia deste menu em lugar nenhum.
 */
export function UserMenu({ isCompact = false }: UserMenuProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const displayName = user?.name ?? user?.email ?? 'Usuário';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <DropdownMenu
      button={{
        label: displayName,
        variant: 'ghost',
        icon: <Avatar name={displayName} size="xsm" />,
        // Expandido, o gatilho ocupa a faixa inteira que o rodapé abre (os
        // 16px de cada lado são dele) — é o alvo largo que se espera de um
        // rodapé de navegação. Recolhido vira botão quadrado: `width: '100%'`
        // ali esticaria o alvo por toda a faixa de 88px e ele deixaria de ler
        // como "o avatar é o menu".
        ...(isCompact ? { isIconOnly: true } : { width: '100%' }),
      }}
      menuWidth={224}
      items={[
        { type: 'section', title: user?.email ?? displayName, items: [] },
        { type: 'divider' },
        { label: 'Sair', icon: <LogOut />, onClick: handleLogout },
      ]}
    />
  );
}
