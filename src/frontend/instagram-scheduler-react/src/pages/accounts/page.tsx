import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Instagram, Facebook, Trash2, AlertTriangle, ExternalLink, KeyRound, AtSign, Linkedin, Building2 } from 'lucide-react';
import { useAccounts, useConnectAccount, useConnectWithToken, useGetFacebookPages, useConnectFacebookPage, useDisconnectAccount, useGetLinkedInOrgs, useConnectLinkedInOrg, type SocialPlatform, type FacebookPageOption, type LinkedInAccountOption, type SocialAccount } from '@/lib/queries';
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
  Threads: {
    label: 'Threads',
    Icon: AtSign,
    gradient: 'from-gray-900 to-gray-600',
    connectLabel: 'Conectar Threads',
  },
  LinkedIn: {
    label: 'LinkedIn',
    Icon: Linkedin,
    gradient: 'from-blue-700 to-blue-500',
    connectLabel: 'Conectar LinkedIn',
  },
};

function ConnectTokenDialog({ platform }: { platform: SocialPlatform }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [pages, setPages] = useState<FacebookPageOption[] | null>(null);
  const { mutate: connect, isPending: isConnecting } = useConnectWithToken();
  const { mutate: connectPage, isPending: isConnectingPage } = useConnectFacebookPage();
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
    connectPage(page, {
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

        {platform === 'Instagram' || platform === 'Threads' || platform === 'LinkedIn' ? (
          <form onSubmit={handleInstagramSubmit} className="flex flex-col gap-4 py-2">
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={platform === 'Threads' ? 'THR...' : 'IGAAk...'}
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <KeyRound className="size-3.5 mt-0.5 shrink-0" />
              {platform === 'Threads'
                ? <p>Pega el token generado desde el <strong>Generador de tokens de usuario</strong> en Meta for Developers → Threads API → Configuración.</p>
                : platform === 'LinkedIn'
                ? <p>Pega un token de acceso de LinkedIn obtenido desde el <strong>OAuth 2.0 Tools</strong> en LinkedIn Developer Portal, o usa el botón "Conectar LinkedIn" para el flujo OAuth automático.</p>
                : <p>Pega tu token de Instagram (<code>IGAAk...</code>) desde Meta for Developers o la variable <code>INSTAGRAM_ACCESS_TOKEN</code> del .env.</p>
              }
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
                  disabled={isConnectingPage}
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

function LinkedInOrgDialog({ account }: { account: SocialAccount }) {
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<LinkedInAccountOption[] | null>(null);
  const { mutate: getOrgs, isPending: isLoading } = useGetLinkedInOrgs();
  const { mutate: connectOrg, isPending: isConnecting } = useConnectLinkedInOrg();

  const handleOpen = () => {
    setOpen(true);
    getOrgs(account.id, {
      onSuccess: (data) => setOrgs(data),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleConnect = (org: LinkedInAccountOption) => {
    const orgId = org.id.startsWith('org:') ? org.id.slice(4) : org.id;
    connectOrg({ personalAccountId: account.id, orgId, orgName: org.name, pictureUrl: org.pictureUrl }, {
      onSuccess: (acc) => {
        toast.success(`Empresa "${acc.name}" conectada`);
        setOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleOpen}>
          <Building2 className="size-3.5" />
          Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cuentas de empresa en LinkedIn</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col gap-2 py-4">
            {[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : orgs && orgs.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Building2 className="size-8 mx-auto mb-2 opacity-30" />
            <p>No se encontraron empresas donde seas administrador.</p>
            <p className="text-xs mt-1">Asegúrate de tener el permiso <code>rw_organization_social</code> en tu app de LinkedIn.</p>
          </div>
        ) : orgs ? (
          <div className="flex flex-col gap-2 py-2 max-h-64 overflow-y-auto">
            {orgs.map(org => (
              <button key={org.id} onClick={() => handleConnect(org)} disabled={isConnecting}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors disabled:opacity-50">
                {org.pictureUrl
                  ? <img src={org.pictureUrl} className="size-10 rounded-md object-cover shrink-0" />
                  : <div className="size-10 rounded-md bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shrink-0">
                      <Building2 className="size-5 text-white" />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{org.name}</p>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
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
              {account.profilePictureUrl
                ? <img src={account.profilePictureUrl} alt={account.username}
                    className="size-9 rounded-full object-cover shrink-0" />
                : <div className={`size-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {account.username.slice(0, 2).toUpperCase()}
                  </div>
              }
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
              {platform === 'LinkedIn' && !account.platformUserId.startsWith('org:') && (
                <LinkedInOrgDialog account={account} />
              )}
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
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    const platform = params.get('platform');
    if (connected === 'true' && platform) {
      toast.success(`Cuenta de ${platform} conectada correctamente`);
    } else if (connected === 'false' && error) {
      toast.error(`Error al conectar: ${decodeURIComponent(error)}`);
    }
    if (connected) {
      window.history.replaceState({}, '', '/accounts');
    }
  }, []);

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Cuentas Sociales</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tus cuentas conectadas por plataforma</p>
      </div>

      <PlatformSection platform="Instagram" />
      <PlatformSection platform="Facebook" />
      <PlatformSection platform="Threads" />
      <PlatformSection platform="LinkedIn" />
    </div>
  );
}
