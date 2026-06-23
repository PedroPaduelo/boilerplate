/**
 * Bloco `user_list` (layout) — renderiza vários Vitrine `UserListItem` numa
 * lista com divisórias.
 */
import { UserListItem } from '@/components/ui/user-list-item';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type UserInput = {
  name?: string;
  email?: string;
  avatar?: string;
  status?: string;
  meta?: string;
};
type UserListBlockProps = { users?: UserInput[] };

const FALLBACK: UserInput[] = [
  { name: 'Usuário 1', email: 'usuario1@exemplo.com', status: 'Ativo' },
  { name: 'Usuário 2', email: 'usuario2@exemplo.com', status: 'Ativo' },
  { name: 'Usuário 3', email: 'usuario3@exemplo.com', status: 'Inativo' },
];

export const Component: BlockComponent<UserListBlockProps> = ({ props }) => {
  const users = props.users?.length ? props.users : FALLBACK;
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {users.map((u, i) => (
        <div key={i} className="px-3 py-2.5">
          <UserListItem
            name={u.name ?? ''}
            email={u.email}
            avatar={u.avatar}
            status={u.status}
            meta={u.meta}
          />
        </div>
      ))}
    </div>
  );
};

export const definition = defineBlock<UserListBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
