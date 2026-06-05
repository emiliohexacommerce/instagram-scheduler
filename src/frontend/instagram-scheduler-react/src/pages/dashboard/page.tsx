import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Instagram, Facebook, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAccounts, usePosts, useSubscription } from '@/lib/queries';
import type { PostStatus, SocialPlatform } from '@/lib/queries';
import { Button } from '@/components/ui/button';

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`size-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<PostStatus, string> = {
  Draft: 'bg-secondary text-secondary-foreground',
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABEL: Record<PostStatus, string> = {
  Draft: 'Borrador', Scheduled: 'Programado', Processing: 'Publicando',
  Published: 'Publicado', Failed: 'Fallido',
};

const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  Instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const PLATFORM_ICON: Record<SocialPlatform, React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
};

function SubscriptionBanner() {
  const { data: sub } = useSubscription();
  if (!sub) return null;

  const isExpiring = sub.status === 'Trial' && sub.daysRemaining <= 7;
  const needsPayment = sub.status === 'PendingPayment' || sub.status === 'Suspended';

  if (!isExpiring && !needsPayment) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${needsPayment ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
      <AlertTriangle className={`size-5 shrink-0 ${needsPayment ? 'text-red-500' : 'text-yellow-500'}`} />
      <p className="text-sm flex-1">
        {needsPayment
          ? 'Tu suscripción expiró. Renueva para seguir publicando.'
          : `Tu trial vence en ${sub.daysRemaining} día${sub.daysRemaining !== 1 ? 's' : ''}. Activa un plan para no perder el acceso.`}
      </p>
      <Button size="sm" asChild>
        <Link to="/plans">Ver planes <ArrowRight className="size-3 ml-1" /></Link>
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: posts = [] } = usePosts();
  const { data: accounts = [] } = useAccounts();

  const stats = useMemo(() => ({
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'Scheduled').length,
    published: posts.filter(p => p.status === 'Published').length,
    failed: posts.filter(p => p.status === 'Failed').length,
  }), [posts]);

  const platformStats = useMemo(() => {
    const platforms: SocialPlatform[] = ['Instagram', 'Facebook'];
    return platforms.map(platform => ({
      platform,
      accounts: accounts.filter(a => a.platform === platform).length,
      published: posts.filter(p =>
        p.results.some(r => r.platform === platform && r.status === 'Published')
      ).length,
    }));
  }, [posts, accounts]);

  const recentPosts = useMemo(() =>
    [...posts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [posts]
  );

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de tu actividad en redes sociales</p>
      </div>

      <SubscriptionBanner />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Programados" value={stats.scheduled} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
        <StatCard icon={CheckCircle2} label="Publicados" value={stats.published} color="bg-green-100 text-green-600 dark:bg-green-900/30" />
        <StatCard icon={XCircle} label="Fallidos" value={stats.failed} color="bg-red-100 text-red-600 dark:bg-red-900/30" />
        <StatCard icon={Instagram} label="Total posts" value={stats.total} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30" />
      </div>

      {/* Platform breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        {platformStats.map(({ platform, accounts: accs, published }) => {
          const Icon = PLATFORM_ICON[platform];
          return (
            <div key={platform} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className={`size-11 rounded-lg flex items-center justify-center ${PLATFORM_COLOR[platform]}`}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{platform}</p>
                <p className="text-sm text-muted-foreground">{accs} cuenta{accs !== 1 ? 's' : ''} · {published} publicado{published !== 1 ? 's' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Posts Recientes</h2>
          </div>
          <div className="divide-y divide-border">
            {recentPosts.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No hay posts aún.</p>
            ) : recentPosts.map(post => (
              <div key={post.id} className="p-4 flex items-start gap-3">
                <div className="flex gap-1 shrink-0">
                  {post.platforms.map(p => {
                    const PIcon = PLATFORM_ICON[p];
                    return <PIcon key={p} className="size-4 text-muted-foreground" />;
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{post.caption}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[post.status]}`}>
                  {STATUS_LABEL[post.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Próximas Publicaciones</h2>
          </div>
          <div className="divide-y divide-border">
            {posts.filter(p => p.status === 'Scheduled' && p.scheduledAt).length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No hay posts programados.</p>
            ) : posts
              .filter(p => p.status === 'Scheduled' && p.scheduledAt)
              .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
              .slice(0, 5)
              .map(post => (
                <div key={post.id} className="p-4 flex items-center gap-3">
                  <div className="flex gap-1 shrink-0">
                    {post.platforms.map(p => {
                      const PIcon = PLATFORM_ICON[p];
                      return <PIcon key={p} className="size-4 text-muted-foreground" />;
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{post.caption}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(post.scheduledAt!).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
