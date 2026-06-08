import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Instagram, Facebook } from 'lucide-react';
import { usePosts, type PostStatus, type ScheduledPost } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const STATUS_DOT: Record<PostStatus, string> = {
  Draft: 'bg-secondary-foreground/40',
  Scheduled: 'bg-blue-500',
  Processing: 'bg-yellow-500',
  Published: 'bg-green-500',
  Failed: 'bg-red-500',
};

const STATUS_LABEL: Record<PostStatus, string> = {
  Draft: 'Borrador', Scheduled: 'Programado', Processing: 'Procesando',
  Published: 'Publicado', Failed: 'Fallido',
};

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="size-2.5" />,
  Facebook: <Facebook className="size-2.5" />,
  Threads: <span className="text-[9px] font-bold">T</span>,
};

function PostDetailPanel({ post, onClose }: { post: ScheduledPost; onClose: () => void }) {
  const date = post.scheduledAt ?? post.createdAt;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm mx-4 shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Detalle del post</h3>
          <Button variant="ghost" size="sm" className="size-7 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {post.mediaUrls?.[0] && (
          <img src={post.mediaUrls[0]} alt=""
            className="w-full h-40 object-cover rounded-lg mb-4" />
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className={`size-2 rounded-full ${STATUS_DOT[post.status]}`} />
          <span className="text-sm font-medium">{STATUS_LABEL[post.status]}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {format(parseISO(date), "d MMM yyyy 'a las' HH:mm", { locale: es })}
          </span>
        </div>

        <p className="text-sm text-foreground/90 line-clamp-4 mb-3">
          {post.caption || <span className="text-muted-foreground italic">Sin caption</span>}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {post.platforms.map(p => (
            <div key={p}
              className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-0.5">
              {PLATFORM_ICON[p]}
              <span>{p}</span>
            </div>
          ))}
        </div>

        {post.results?.length > 0 && (
          <div className="mt-3 border-t border-border pt-3 flex flex-col gap-1.5">
            {post.results.map(r => (
              <div key={r.platform} className="flex items-center gap-2 text-xs">
                <div className={`size-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
                <span>{r.platform}</span>
                <span className="text-muted-foreground ml-auto">{STATUS_LABEL[r.status]}</span>
                {r.errorMessage && (
                  <span className="text-red-500 truncate max-w-[160px]" title={r.errorMessage}>
                    {r.errorMessage}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { data: posts = [] } = usePosts();
  const [current, setCurrent] = useState(() => new Date());
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const postsByDay = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    posts.forEach(p => {
      const date = p.scheduledAt ?? p.createdAt;
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = String(d.getDate());
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [posts, year, month]);

  const today = new Date();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-muted-foreground text-sm mt-1">Vista mensual de tus publicaciones</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="sm" className="size-8 p-0"
            onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="font-semibold">{MONTHS[month]} {year}</h2>
          <Button variant="ghost" size="sm" className="size-8 p-0"
            onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday = day !== null && today.getDate() === day &&
              today.getMonth() === month && today.getFullYear() === year;
            const dayPosts = day ? (postsByDay[String(day)] ?? []) : [];

            return (
              <div
                key={i}
                className={`min-h-[90px] p-1.5 border-b border-r border-border text-sm
                  ${!day ? 'bg-muted/30' : ''}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                {day && (
                  <>
                    <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium
                      ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                      {day}
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {dayPosts.slice(0, 3).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPost(p)}
                          className="flex items-center gap-1 truncate w-full hover:opacity-70 transition-opacity text-left"
                        >
                          <div className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT[p.status]}`} />
                          <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground">
                            {p.platforms.slice(0, 2).map(pl => (
                              <span key={pl}>{PLATFORM_ICON[pl]}</span>
                            ))}
                          </div>
                          <span className="text-[11px] truncate text-muted-foreground">
                            {p.caption?.slice(0, 20) || 'Post'}
                          </span>
                        </button>
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} más</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {(['Scheduled', 'Published', 'Failed', 'Draft'] as PostStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
            <span>{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>

      {selectedPost && (
        <PostDetailPanel post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
