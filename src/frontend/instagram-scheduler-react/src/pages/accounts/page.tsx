import { useState } from 'react';
import { toast } from 'sonner';
import { Instagram, Facebook, Trash2, AlertTriangle, ExternalLink, KeyRound } from 'lucide-react';
import { useAccounts, useConnectAccount, useConnectWithToken, useGetFacebookPages, useDisconnectAccount, type SocialPlatform, type FacebookPageOption } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';

const PLATFORM_CONFIG: Record<SocialPlatform, {
  label: string;
  Icon: React.ElementType;
  gradient: string;
  connectLabel: string;
}> = {
  Instagram: {
    label: 'Instagram',
    Icon: Instagram,
    gradient: 'from-purple-500 to-pink-500',
    connectLabel: 'Conectar Instagram',
  },
  Facebook: {
    label: 'Facebook',
    Icon: Facebook,
    gradient: 'from-blue-600 to-blue-400',
    connectLabel: 'Conectar Facebook',
  },
};

function ConnectTokenDialog({ platform }: { platform: SocialPlatform }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [pages, setPages] = useState<FacebookPageOption[] | null>(null);
  const { mutate: connect, isPending: isConnecting } = useConnectWithToken();
  const { mutate: getPages, isPending: isLoadingPages } = useGetFacebookPages();

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) { setToken(''); setPages(null); }
  };

  const handleInstagramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    connect({ accessToken: token.trim(), platform }, {
      onSuccess: (account) => {
        toast.success(`Cuenta @${account.username} conectada`);
        handleClose(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleFetchPages = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    getPages(token.trim(), {
      onSuccess: (result) => setPages(result),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleConnectPage = (page: FacebookPageOption) => {
    connect({ accessToken: page.pageToken, platform: 'Facebook' }, {
      onSuccess: (account) => {
        toast.success(`Página "${account.name}" conectada`);
        handleClose(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <KeyRound className="size-3.5" />
          Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar {platform} con Access Token</DialogTitle>
        </DialogHeader>

        {platform === 'Instagram' ? (
          <form onSubmit={handleInstagramSubmit} className="flex flex-col gap-4 py-2">
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="IGAAk..."
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <KeyRound className="size-3.5 mt-0.5 shrink-0" />
              <p>Pega tu token de Instagram (<code>IGAAk...</code>) desde Meta for Developers o la variable <code>INSTAGRAM_ACCESS_TOKEN</code> del .env.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button type="submit" disabled={isConnecting || !token.trim()}>
                {isConnecting ? 'Conectando...' : 'Conectar'}
              </Button>
            </DialogFooter>
          </form>
        ) : pages ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">{pages.length} página{pages.length !== 1 ? 's' : ''} encontrada{pages.length !== 1 ? 's' : ''}. Selecciona cuál conectar:</p>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {pages.map(page => (
                <button
                  key={page.pageId}
                  onClick={() => handleConnectPage(page)}
                  disabled={isConnecting}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors disabled:opacity-50"
                >
                  {page.pictureUrl ? (
                    <img src={page.pictureUrl} alt={page.name} className="size-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="size-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {page.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{page.name}</p>
                    <p className="text-xs text-muted-foreground">{page.pageId}</p>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPages(null)}>Volver</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleFetchPages} className="flex flex-col gap-4 py-2">
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="EAAk..."
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <KeyRound className="size-3.5 mt-0.5 shrink-0" />
              <p>Pega un User Access Token de Facebook (<code>EAAk...</code>) con permiso <code>pages_show_list</code> desde Meta for Developers. Se mostrarán las páginas disponibles para elegir.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoadingPages || !token.trim()}>
                {isLoadingPages ? 'Buscando páginas...' : 'Buscar páginas'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlatformSection({ platform }: { platform: SocialPlatform }) {
  const { data: accounts = [], isLoading } = useAccounts(platform);
  const { mutate: connect, isPending: isConnecting } = useConnectAccount();
  const { mutate: disconnect } = useDisconnectAccount();
  const { label, Icon, gradient, connectLabel } = PLATFORM_CONFIG[platform];

  const handleConnect = () => {
    connect(platform, {
      onSuccess: (res) => { window.location.href = res.url; },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDisconnect = (id: number, username: string) => {
    if (!confirm(`¿Desconectar @${username} de ${label}?`)) return;
    disconnect(id, {
      onSuccess: () => toast.success('Cuenta desconectada'),
      onError: (err) => toast.error(err.message),
    });
  };

  const isExpiringSoon = (expiresAt: string) =>
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 7;

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`size-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="size-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">{label}</h2>
            <p className="text-xs text-muted-foreground">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} conectada{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectTokenDialog platform={platform} />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            <ExternalLink className="size-3.5" />
            {isConnecting ? 'Redirigiendo...' : connectLabel}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-6 flex flex-col items-center gap-2 text-center">
          <Icon className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No hay cuentas de {label} conectadas</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {accounts.map(account => (
            <div key={account.id} className="p-4 flex items-center gap-3">
              <div className={`size-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs`}>
                {account.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">@{account.username}</p>
                  <div className={`size-1.5 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{account.name}</p>
              </div>
              {isExpiringSoon(account.tokenExpiresAt) && (
                <AlertTriangle className="size-4 text-yellow-500 shrink-0" />
              )}
              <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                Exp: {new Date(account.tokenExpiresAt).toLocaleDateString('es')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => handleDisconnect(account.id, account.username)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <div className="container py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Cuentas Sociales</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tus cuentas conectadas por plataforma</p>
      </div>

      <PlatformSection platform="Instagram" />
      <PlatformSection platform="Facebook" />
    </div>
  );
}
