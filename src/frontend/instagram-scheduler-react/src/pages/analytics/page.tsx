import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, FileText, CheckCircle2, XCircle, Clock, Instagram, Facebook } from 'lucide-react';
import { useAnalytics, useAccounts, useAccountInsights, type SocialAccount } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const PLATFORM_COLOR: Record<string, string> = {
  Instagram: '#E1306C',
  Facebook: '#1877F2',
  Threads: '#000000',
};

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="size-4" />,
  Facebook: <Facebook className="size-4" />,
};

const DAYS_OPTIONS = [7, 14, 30, 90] as const;
type Days = typeof DAYS_OPTIONS[number];

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function AccountInsightCard({ account }: { account: SocialAccount }) {
  const { data } = useAccountInsights(account.id);
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      {account.profilePictureUrl
        ? <img src={account.profilePictureUrl} className="size-10 rounded-full object-cover" />
        : <div className="size-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
            {account.username[0]?.toUpperCase()}
          </div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">@{account.username}</p>
        <p className="text-xs text-muted-foreground">{account.platform}</p>
      </div>
      {data ? (
        <div className="text-right">
          {data.followersCount != null && (
            <p className="text-lg font-bold">{data.followersCount.toLocaleString()}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {data.followersCount != null ? 'seguidores' : 'sin datos'}
          </p>
          {data.mediaCount != null && (
            <p className="text-xs text-muted-foreground">{data.mediaCount} posts</p>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Cargando...</div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<Days>(30);
  const { data: analytics, isLoading } = useAnalytics(days);
  const { data: accounts = [] } = useAccounts();

  const igFbAccounts = accounts.filter(a => a.platform === 'Instagram' || a.platform === 'Facebook');

  const timelineData = analytics?.timeline.map(p => ({
    date: format(parseISO(p.date), 'd MMM', { locale: es }),
    Publicados: p.published,
    Fallidos: p.failed,
  })) ?? [];

  const platformData = analytics?.platformBreakdown.map(p => ({
    name: p.platform,
    Publicados: p.published,
    Fallidos: p.failed,
  })) ?? [];

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Rendimiento de tus publicaciones</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {DAYS_OPTIONS.map(d => (
            <Button key={d} size="sm" variant={days === d ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs" onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total publicaciones" value={analytics?.totalPosts ?? 0}
          icon={<FileText className="size-5 text-blue-600" />} color="bg-blue-50 dark:bg-blue-950" />
        <KpiCard label="Publicadas" value={analytics?.publishedPosts ?? 0}
          sub={`${analytics?.thisMonthPosts ?? 0} este mes`}
          icon={<CheckCircle2 className="size-5 text-green-600" />} color="bg-green-50 dark:bg-green-950" />
        <KpiCard label="Tasa de éxito" value={`${analytics?.successRate ?? 0}%`}
          icon={<TrendingUp className="size-5 text-purple-600" />} color="bg-purple-50 dark:bg-purple-950" />
        <KpiCard label="Fallidas" value={analytics?.failedPosts ?? 0}
          sub={`${analytics?.scheduledPosts ?? 0} programadas`}
          icon={<XCircle className="size-5 text-red-600" />} color="bg-red-50 dark:bg-red-950" />
      </div>

      {/* Timeline chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Publicaciones en los últimos {days} días</h2>
        {timelineData.every(d => d.Publicados === 0 && d.Fallidos === 0) ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            <Clock className="size-4 mr-2" />No hay datos en este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false}
                interval={days <= 14 ? 0 : Math.floor(days / 7)} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Publicados" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Fallidos" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Por plataforma</h2>
          {platformData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={platformData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Publicados" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Fallidos" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-col gap-2">
                {analytics?.platformBreakdown.map(p => (
                  <div key={p.platform} className="flex items-center gap-3">
                    <div className="size-2 rounded-full" style={{ background: PLATFORM_COLOR[p.platform] ?? '#888' }} />
                    <span className="text-sm flex-1">{p.platform}</span>
                    <span className="text-sm font-medium">{p.total} posts</span>
                    <span className="text-xs text-muted-foreground">
                      {p.total > 0 ? Math.round(p.published / p.total * 100) : 0}% éxito
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Account insights */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Cuentas conectadas</h2>
          {igFbAccounts.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              No hay cuentas de Instagram o Facebook conectadas
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {igFbAccounts.map(acc => (
                <AccountInsightCard key={acc.id} account={acc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
