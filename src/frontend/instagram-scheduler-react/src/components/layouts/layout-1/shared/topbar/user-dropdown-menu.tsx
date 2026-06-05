import { LogOut, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export function UserDropdownMenu() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="bottom" align="end">
        <div className="flex items-center gap-3 p-3">
          <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2"
          onSelect={e => e.preventDefault()}
        >
          <Moon className="size-4" />
          <div className="flex items-center justify-between grow">
            Modo Oscuro
            <Switch
              size="sm"
              checked={theme === 'dark'}
              onCheckedChange={c => setTheme(c ? 'dark' : 'light')}
            />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
