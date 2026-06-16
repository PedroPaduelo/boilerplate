import { useAuthStore } from '@/features/auth/store';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';

export function Header() {
  const { user } = useAuthStore();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.name}</span>
        <Avatar>
          <AvatarFallback>{initials || 'U'}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
