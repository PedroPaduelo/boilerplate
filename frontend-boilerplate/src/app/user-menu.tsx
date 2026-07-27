import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useAuthStore } from '@/features/auth/store';

/**
 * Menu da conta, ancorado no rodapé da navegação.
 *
 * O `label` do gatilho carrega o nome do usuário: é o que o leitor de tela
 * anuncia e o que aparece como texto quando a barra está expandida.
 */
export function UserMenu() {
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
        width: '100%',
        icon: <Avatar name={displayName} size="xsm" />,
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
