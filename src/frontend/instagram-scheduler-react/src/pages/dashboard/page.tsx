import { useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Instagram, Facebook, XCircle, AlertTriangle, ArrowRight, AtSign, TrendingUp } from 'lucide-react';
import { useAccounts, usePosts, useSubscription } from '@/lib/queries';
import type { PostStatus, SocialPlatform } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub?: string; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`size-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
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
  Threads: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const PLATFORM_ICON: Record<SocialPlatform, React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Threads: AtSign,
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

function usePostNotifications(posts: ReturnType<typeof usePosts>['data']) {
  const prevStatuses = useRef<Record<number, PostStatus>>({});

  useEffect(() => {
    if (!posts) return;
    posts.forEach(post => {
      const prev = prevStatuses.current[post.id];
      if (prev && prev !== post.status) {
        if (post.status === 'Published')
          toast.success(`Post publicado`, { description: post.caption.slice(0, 60) });
        else if (post.status === 'Failed')
          toast.error(`Post fallido`, { description: post.caption.slice(0, 60) });
      }
      prevStatuses.current[post.id] = post.status;
    });
  }, [posts]);
}

export default function DashboardPage() {
  const { data: posts = [] } = usePosts();
  const { data: accounts = [] } = useAccounts();

  usePostNotifications(posts);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = useMemo(() => {
    const published = posts.filter(p => p.status === 'Published');
    const failed = posts.filter(p => p.status === 'Failed');
    const total = published.length + failed.length;
    return {
      total: posts.length,
      scheduled: posts.filter(p => p.status === 'Scheduled').length,
      published: published.length,
      failed: failed.length,
      successRate: total > 0 ? Math.round((published.length / total) * 100) : 0,
      thisWeek: posts.filter(p => p.status === 'Published' && p.scheduledAt && new Date(p.scheduledAt) >= weekAgo).length,
      thisMonth: posts.filter(p => p.status === 'Published' && p.scheduledAt && new Date(p.scheduledAt) >= monthAgo).length,
    };
  }, [posts]);

  const platformStats = useMemo(() => {
    const platforms: SocialPlatform[] = ['Instagram', 'Facebook', 'Threads'];
    return platforms.map(platform => ({
      platform,
      accounts: accounts.filter(a => a.platform === platform).length,
      published: posts.filter(p =>
        p.results.some(r => r.platform === platform && r.status === 'Published')
      ).length,
      failed: posts.filter(p =>
        p.results.some(r => r.platform === platform && r.status === 'Failed')
      ).length,
    })).filter(p => p.accounts > 0 || p.published > 0);
  }, [posts, accounts]);

  const recentPosts = useMemo(() =>
    [...posts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [posts]
  );

  const failedPosts = useMemo(() =>
    posts.filter(p => p.status === 'Failed').slice(0, 3),
    [posts]
  );

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de tu actividad en redes sociales</p>
      </div>

      <SubscriptionBanner />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Programados" value={stats.scheduled} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
        <StatCard icon={CheckCircle2} label="Publicados" value={stats.published} sub={`${stats.thisWeek} esta semana`} color="bg-green-100 text-green-600 dark:bg-green-900/30" />
        <StatCard icon={XCircle} label="Fallidos" value={stats.failed} color="bg-red-100 text-red-600 dark:bg-red-900/30" />
        <StatCard icon={TrendingUp} label="Tasa de éxito" value={stats.successRate} sub={`${stats.thisMonth} este mes`} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30" />
      </div>

      {/* Platform breakdown */}
      {platformStats.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {platformStats.map(({ platform, accounts: accs, published, failed }) => {
            const Icon = PLATFORM_ICON[platform];
            return (
              <div key={platform} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className={`size-11 rounded-lg flex items-center justify-center ${PLATFORM_COLOR[platform]}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{platform}</p>
                  <p className="text-sm text-muted-foreground">{accs} cuenta{accs !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">{published} publicado{published !== 1 ? 's' : ''} · {failed} fallido{failed !== 1 ? 's' : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Posts recientes */}
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
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(post.createdAt).toLocaleDateString('es')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[post.status]}`}>
                  {STATUS_LABEL[post.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Próximas publicaciones */}
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
                .slice(0, 4)
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

          {/* Posts fallidos */}
          {failedPosts.length > 0 && (
            <div className="bg-card border border-red-200 dark:border-red-900 rounded-xl">
              <div className="p-5 border-b border-red-200 dark:border-red-900 flex items-center gap-2">
                <XCircle className="size-4 text-red-500" />
                <h2 className="font-semibold text-red-600 dark:text-red-400">Posts Fallidos</h2>
              </div>
              <div className="divide-y divide-border">
                {failedPosts.map(post => (
                  <div key={post.id} className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{post.caption}</p>
                      {post.results.filter(r => r.errorMessage).map(r => (
                        <p key={r.platform} className="text-xs text-red-500 mt-0.5 truncate">
                          {r.platform}: {r.errorMessage}
                        </p>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 text-xs" asChild>
                      <Link to="/posts">Ver</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
